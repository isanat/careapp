import { prisma } from '../src/client';

const run = async () => {
  const family = await prisma.user.create({
    data: {
      role: 'FAMILIAR',
      name: 'Maria Demo',
      email: 'familia@idosolink.dev',
      profileFamily: {
        create: {
          city: 'Lisboa',
          elderInfo: 'Idoso com mobilidade reduzida, precisa de apoio diário.',
          emergencyContact: 'João Demo - +351 999 000 111'
        }
      }
    }
  });

  const caregivers = await Promise.all([
    prisma.user.create({
      data: {
        role: 'CUIDADOR',
        name: 'Ana Silva',
        email: 'ana@idosolink.dev',
        profileCaregiver: {
          create: {
            city: 'Lisboa',
            radiusKm: 12,
            hourlyRateEur: 18,
            services: ['Higiene', 'Companhia', 'Medicação'],
            availabilityJson: JSON.stringify({ weekdays: ['Mon', 'Wed', 'Fri'], hours: '08:00-16:00' }),
            verificationStatus: 'VERIFIED'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        role: 'CUIDADOR',
        name: 'Carlos Moreira',
        email: 'carlos@idosolink.dev',
        profileCaregiver: {
          create: {
            city: 'Porto',
            radiusKm: 20,
            hourlyRateEur: 16,
            services: ['Mobilidade', 'Companhia', 'Fisioterapia leve'],
            availabilityJson: JSON.stringify({ weekdays: ['Tue', 'Thu'], hours: '10:00-18:00' }),
            verificationStatus: 'PENDING'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        role: 'CUIDADOR',
        name: 'Luisa Costa',
        email: 'luisa@idosolink.dev',
        profileCaregiver: {
          create: {
            city: 'Lisboa',
            radiusKm: 8,
            hourlyRateEur: 22,
            services: ['Cuidados noturnos', 'Alimentação', 'Companhia'],
            availabilityJson: JSON.stringify({ weekdays: ['Mon', 'Tue', 'Wed', 'Thu'], hours: '18:00-06:00' }),
            verificationStatus: 'VERIFIED'
          }
        }
      }
    })
  ]);

  const contract = await prisma.contract.create({
    data: {
      familyUserId: family.id,
      caregiverUserId: caregivers[0].id,
      status: 'PENDING_ACCEPTANCE',
      hoursPerWeek: 20,
      hourlyRateEur: 18,
      tasksJson: JSON.stringify(['Higiene', 'Companhia', 'Medicação']),
      startDate: new Date(),
      totalEurEstimated: 1440,
      acceptance: {
        create: {}
      }
    }
  });

  await prisma.tokenLedger.createMany({
    data: [
      {
        userId: family.id,
        type: 'CREDIT',
        reason: 'Seed activation',
        amountToken: 250,
        amountEur: 25,
        refId: contract.id
      },
      {
        userId: caregivers[0].id,
        type: 'CREDIT',
        reason: 'Seed activation',
        amountToken: 250,
        amountEur: 25,
        refId: contract.id
      }
    ]
  });
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
