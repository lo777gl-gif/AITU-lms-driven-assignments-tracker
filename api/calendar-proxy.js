// /api/calendar-proxy.js
export default async function handler(req, res) {
  // Разрешаем вашему фронтенду брать данные без ошибок CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Получаем URL внешнего календаря из параметров запроса
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Параметр url отсутствует в запросе' });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Не удалось скачать внешний календарь' });
    }

    const icsData = await response.text();
    
    // Возвращаем текст .ics файла обратно на ваш фронтенд
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    return res.status(200).send(icsData);
  } catch (error) {
    return res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
  }
}
