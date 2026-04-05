export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Отправляем фото в Telegram
        const tgFormData = new FormData();
        tgFormData.append('chat_id', env.TG_CHAT_ID);
        tgFormData.append('photo', file);
        
        const tgResponse = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: tgFormData
        });
        
        const tgData = await tgResponse.json();
        
        if (!tgData.ok) {
            console.error('Telegram API error:', tgData);
            return new Response(JSON.stringify({ error: 'Telegram API error', details: tgData }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Получаем file_id и создаём ссылку
        const fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
        
        // Получаем путь к файлу
        const fileResponse = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileData = await fileResponse.json();
        
        const filePath = fileData.result.file_path;
        const imageUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${filePath}`;
        
        return new Response(JSON.stringify({
            success: true,
            url: imageUrl,
            fileId: fileId
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
