import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Simple file upload API
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG, WEBP, GIF ou PDF' }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${session.user.id}-${type}-${Date.now()}.${ext}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log('📂 Uploads directory:', uploadsDir);
    
    if (!existsSync(uploadsDir)) {
      console.log('📁 Creating uploads directory...');
      await mkdir(uploadsDir, { recursive: true });
    }

    // Write file
    const filepath = path.join(uploadsDir, filename);
    console.log('💾 Writing file to:', filepath);
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/${filename}`;
    console.log('✅ Upload successful:', url);

    return NextResponse.json({ 
      success: true, 
      url,
      filename 
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
