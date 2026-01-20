Wesam Electronics - Static Store (GitHub Pages) + Firebase
========================================================

1) ضع Firebase config
---------------------
افتح: assets/js/firebase-config.js
واستبدل قيم PUT_YOURS بالقيم من Firebase Console.

2) أنشئ Collections في Firestore
--------------------------------
- categories
- products
- orders

3) الصور بروابط فقط
-------------------
في المنتج ضع image_urls مثل:
https://i.postimg.cc/xxxx/your-image.jpg

4) تشغيل محليًا
---------------
افضل طريقة (لأن ES Modules تحتاج سيرفر):
- افتح VS Code
- ثبّت إضافة Live Server
- افتح index.html واضغط Go Live

5) رفع على GitHub Pages
------------------------
- ارفع الملفات إلى repo
- Settings > Pages
- Deploy from a branch: main / root
- سيظهر رابط الموقع

6) صفحة الأدمن
--------------
/admin/index.html
تحتاج تسجيل دخول Firebase Auth (email/password).

7) ملاحظة مهمة عن الأمان (Firestore Rules)
------------------------------------------
ضع قواعد مناسبة حتى:
- القراءة للزوار (products, categories)
- الكتابة للأدمن فقط
- إنشاء orders للزوار مسموح

ملف rules المقترح موجود: firestore.rules.txt
