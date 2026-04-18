import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-turso";

/**
 * Haversine formula: calculates distance in kilometers between two lat/lng points.
 */
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const service = searchParams.get("service");
    const minRating = searchParams.get("minRating");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Proximity matching: family provides their lat/lng
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusParam = searchParams.get("radius"); // max radius in km (optional)
    const familyLat = latParam ? parseFloat(latParam) : null;
    const familyLng = lngParam ? parseFloat(lngParam) : null;
    const maxRadiusKm = radiusParam ? parseFloat(radiusParam) : null;

    let sql = `
      SELECT
        u.id, u.name, u.profileImage, u.verificationStatus,
        p.title, p.bio, p.city, p.services, p.hourlyRateEur,
        p.averageRating, p.totalReviews, p.totalContracts, p.experienceYears,
        p.latitude, p.longitude
      FROM User u
      INNER JOIN ProfileCaregiver p ON u.id = p.userId
      WHERE u.role = 'CAREGIVER' AND u.status = 'ACTIVE' AND u.verificationStatus = 'VERIFIED'
    `;

    const args: string[] = [];

    if (city) {
      sql += ` AND p.city LIKE ?`;
      args.push(`%${city}%`);
    }

    if (service) {
      sql += ` AND p.services LIKE ?`;
      args.push(`%${service}%`);
    }

    if (minRating) {
      sql += ` AND p.averageRating >= ?`;
      args.push(minRating);
    }

    sql += ` ORDER BY p.averageRating DESC, p.totalReviews DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    let caregivers = result.rows.map((row) => {
      const caregiverLat = row.latitude ? Number(row.latitude) : null;
      const caregiverLng = row.longitude ? Number(row.longitude) : null;

      // Calculate distance if both family and caregiver have coordinates
      let distanceKm: number | null = null;
      if (
        familyLat != null &&
        familyLng != null &&
        caregiverLat != null &&
        caregiverLng != null
      ) {
        distanceKm =
          Math.round(
            haversineDistanceKm(
              familyLat,
              familyLng,
              caregiverLat,
              caregiverLng,
            ) * 10,
          ) / 10; // round to 1 decimal
      }

      return {
        id: row.id,
        name: row.name,
        profileImage: row.profileImage,
        verificationStatus: row.verificationStatus,
        title: row.title,
        bio: row.bio,
        city: row.city,
        services: row.services
          ? (() => {
              try {
                return JSON.parse(String(row.services));
              } catch {
                return String(row.services).split(",").filter(Boolean);
              }
            })()
          : [],
        hourlyRateEur: Number(row.hourlyRateEur) || 0,
        averageRating: Number(row.averageRating) || 0,
        totalReviews: Number(row.totalReviews) || 0,
        totalContracts: Number(row.totalContracts) || 0,
        experienceYears: Number(row.experienceYears) || 0,
        distanceKm,
      };
    });

    // If family coordinates are provided, filter by max radius and sort by proximity
    if (familyLat != null && familyLng != null) {
      // Filter by radius if specified
      if (maxRadiusKm != null) {
        caregivers = caregivers.filter(
          (c) => c.distanceKm != null && c.distanceKm <= maxRadiusKm,
        );
      }

      // Sort by distance (nearest first). Caregivers without coordinates go to the end.
      caregivers.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    const response = NextResponse.json({ caregivers });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    console.error("Error fetching caregivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
