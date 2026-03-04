import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Upload API - stores images as base64 data URLs in database
export async function POST(request: NextRequest) {
  console.log('📤 Upload API called');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', session ? { id: session.user?.id, name: session.user?.name } : 'No session');
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized - faça login novamente' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    console.log('📁 File info:', { 
      name: file?.name, 
      type: file?.type, 
      size: file?.size,
      uploadType: type
    });

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validate file size (max 2MB for base64)
    if (file.size > 2 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB' }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedDocTypes = ['application/pdf'];
    const isImage = allowedImageTypes.includes(file.type);
    const isDocument = allowedDocTypes.includes(file.type);

    if (!isImage && !isDocument) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG, WEBP, GIF ou PDF' }, { status: 400 });
    }

    // Only allow PDFs for document uploads (background_check), not for profile images
    if (isDocument && type === 'profile') {
      console.log('❌ PDF not allowed for profile images');
      return NextResponse.json({ error: 'Fotos de perfil devem ser imagens (JPG, PNG, WEBP ou GIF)' }, { status: 400 });
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.log('✅ Image converted to base64, length:', dataUrl.length);

    // For profile images, update user directly
    if (type === 'profile') {
      await db.execute({
        sql: `UPDATE User SET profileImage = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [dataUrl, session.user.id]
      });
      console.log('✅ Profile image updated in database');
    }

    // For background check, update the specific field
    if (type === 'background_check') {
      await db.execute({
        sql: `UPDATE User SET backgroundCheckUrl = ?, backgroundCheckStatus = 'SUBMITTED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [dataUrl, session.user.id]
      });
      console.log('✅ Background check document updated in database');
    }

    return NextResponse.json({ 
      success: true, 
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
