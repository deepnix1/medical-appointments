# 🎯 Retell AI Entegrasyonu - Hızlı Başlangıç

## 📋 Özet

Bu dokümantasyon, Retell AI ile inbound call sistemi kurarak otomatik randevu oluşturma sürecini açıklar.

## 🚀 Hızlı Kurulum

### 1. Environment Variables
```bash
# .env.local dosyasına ekleyin
RETELL_WEBHOOK_SECRET=your_retell_webhook_secret_here
```

### 2. Webhook URL'leri
```
Randevu Oluşturma: https://your-domain.com/api/webhooks/retell/appointment
Randevu İptal:     https://your-domain.com/api/webhooks/retell/cancel
```

### 3. Test
```bash
# Webhook'ları test edin
npm run test:webhook
```

## 🤖 Retell AI Konfigürasyonu

### Agent Ayarları
- **Dil**: Türkçe
- **Ses**: Türkçe Kadın
- **Conversation Flow**: Randevu oluşturma

### Webhook Payload
```json
{
  "doctor_id": "selected_doctor_id",
  "caller_number": "+905551234567",
  "patient_first_name": "Ahmet",
  "patient_last_name": "Yılmaz", 
  "patient_tc_number": "12345678901",
  "requested_date": "2024-02-15",
  "requested_time": "14:30"
}
```

## 📞 Call Flow

```
1. Arayan kişi → Retell AI numarasını arar
2. AI hasta bilgilerini toplar (ad, soyad, telefon, TC)
3. Doktor seçimi yapılır
4. Tarih ve saat seçilir
5. Webhook → Uygulamanıza POST request
6. Randevu otomatik oluşturulur
7. AI onay mesajı verir
```

## 🔧 Teknik Detaylar

### Webhook Endpoints
- **POST** `/api/webhooks/retell/appointment` - Randevu oluşturma
- **POST** `/api/webhooks/retell/cancel` - Randevu iptal

### Security
- Webhook secret ile doğrulama
- Phone number validation
- TC kimlik validation
- Date/time validation

### Error Handling
- Invalid phone format
- Missing required fields
- Doctor availability check
- Time slot conflict

## 📊 Monitoring

### Logs
```javascript
console.log('Webhook received:', {
  timestamp: new Date().toISOString(),
  payload: body
});
```

### Metrics
- Call success rate
- Appointment booking rate
- Webhook response time
- Error rates

## 🧪 Testing

### Local Testing
```bash
# Development server'ı başlatın
npm run dev

# Webhook'ları test edin
npm run test:webhook
```

### Production Testing
```bash
# Production webhook'ları test edin
npm run test:webhook:prod
```

## 🚀 Deployment

### Vercel
```bash
vercel --prod
vercel env add RETELL_WEBHOOK_SECRET
```

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 📱 Mobile Integration

Retell AI SDK'sını mobile app'inize entegre edebilirsiniz:

```javascript
import { RetellAI } from 'retell-ai-sdk';

const retell = new RetellAI({
  apiKey: 'your_api_key',
  webhookUrl: 'https://your-domain.com/api/webhooks/retell/appointment'
});
```

## 🔄 Callback Responses

### Success
```json
{
  "status": "accepted",
  "appointment_id": "app_123",
  "booked_date": "2024-02-15",
  "booked_time": "14:30",
  "message": "Randevunuz başarıyla oluşturuldu!"
}
```

### Error
```json
{
  "status": "error",
  "message": "Randevu oluşturulamadı. Lütfen tekrar deneyin.",
  "error_code": "SLOT_UNAVAILABLE"
}
```

## 🎯 Best Practices

1. **Rate Limiting**: Webhook'lar için rate limiting
2. **Idempotency**: Duplicate call'ları handle edin
3. **Retry Logic**: Failed webhook'lar için retry
4. **Monitoring**: Performance monitoring
5. **Backup**: Critical data backup

## 🆘 Troubleshooting

### Common Issues
1. **Webhook not receiving**: URL ve secret kontrolü
2. **Invalid phone format**: Phone validation
3. **Doctor not found**: Doctor ID kontrolü
4. **Time slot conflict**: Availability check

### Debug Commands
```bash
# Webhook logs'ları kontrol edin
curl -X POST http://localhost:3000/api/webhooks/retell/appointment \
  -H "Content-Type: application/json" \
  -H "x-retell-secret: your_secret" \
  -d '{"doctor_id":"test","caller_number":"+905551234567","requested_date":"2024-02-15","requested_time":"14:30"}'
```

## 📞 Support

- **Retell AI Docs**: [docs.retellai.com](https://docs.retellai.com)
- **GitHub Issues**: Repository'de issue açın
- **Email**: support@retellai.com

---

## 🎉 Sonuç

Bu entegrasyon ile:
- ✅ Otomatik randevu oluşturma
- ✅ Hasta bilgilerini toplama
- ✅ Doktor seçimi
- ✅ Tarih/saat seçimi
- ✅ Webhook ile real-time sync
- ✅ Error handling
- ✅ Security validation

**Retell AI + Your App = Seamless Appointment Booking! 🚀**
