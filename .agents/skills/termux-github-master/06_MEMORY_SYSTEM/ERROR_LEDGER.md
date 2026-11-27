# سجل الأخطاء

## قواعد السجل
- كل خطأ مؤكد يُسجَّل بمعرف فريد.
- `repeat_allowed: false` يعني أن الأمر الذي سبّبه ممنوع تكراره كما هو.

## ERR-001
```yaml
error_id: ERR-001
category: command_formatting
description: رابط Markdown نُسخ داخل أمر Bash
cause: نُسخ النص بصيغة [نص](رابط) بدل الرابط الخام
impact: فشل تنفيذ الأمر
solution: استخدم الرابط الخام فقط دون أقواس أو نص Markdown
status: resolved
repeat_allowed: false
```

## ملاحظات من المحادثة السابقة (غير مؤكدة بعد)
- تشغيل Flask (مستودع Flaskr) أُبلغ عنه بالنجاح. يحتاج إعادة تأكيد على هذا الجهاز.
- أوامر Node.js والرفع إلى GitHub لم تُختبر. لا تُعامَل كحقيقة.
