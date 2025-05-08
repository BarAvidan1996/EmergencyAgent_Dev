# Emergency AI Assistant

מערכת AI Agent המסייעת למשתמשים במצבי חירום, כוללת:
- מערכת Q&A מבוססת RAG עם מסמכי פיקוד העורף
- מערכת חיפוש והכוונה למקלטים
- ניהול רשימות ציוד חירום
- מערכת התראות

## טכנולוגיות
- Frontend: React + TypeScript
- Backend: Node.js + Express
- מסד נתונים: MongoDB
- אימות: JWT
- API חיצוניים: Twilio, Google Maps, GovMap

## התקנה והרצה

### דרישות מקדימות
- Node.js (v18 ומעלה)
- npm או yarn
- חשבון Render
- חשבון Twilio
- API keys ל-Google Maps ו-GovMap

### התקנה
1. התקנת תלויות Backend:
```bash
cd server
npm install
```

2. התקנת תלויות Frontend:
```bash
cd client
npm install
```

3. הגדרת משתני סביבה:
- צור קובץ `.env` בתיקיית `server` עם המשתנים הבאים:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOVMAP_API_KEY=your_govmap_key
```

### הרצה
1. הפעלת שרת Backend:
```bash
cd server
npm run dev
```

2. הפעלת Frontend:
```bash
cd client
npm start
```

## מבנה הפרויקט
- `/client` - קוד Frontend
- `/server` - קוד Backend
- `/docs` - מסמכי פיקוד העורף 