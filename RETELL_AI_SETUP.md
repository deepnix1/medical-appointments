# Retell AI Entegrasyonu Kurulum Rehberi

## 🎯 Genel Bakış

Bu rehber, Retell AI ile inbound call sistemi kurarak otomatik randevu oluşturma sürecini açıklar.

## 📋 Gereksinimler

1. **Retell AI Hesabı** - [retellai.com](https://retellai.com) üzerinden hesap oluşturun
2. **Webhook URL'leri** - Uygulamanızın deploy edilmiş olması gerekir
3. **Environment Variables** - Retell AI webhook secret'ı

## 🔧 1. Environment Variables

`.env.local` dosyanıza ekleyin:

```bash
RETELL_WEBHOOK_SECRET=your_retell_webhook_secret_here
```

## 🌐 2. Webhook URL'leri

Uygulamanız deploy edildikten sonra şu URL'leri kullanın:

### Randevu Oluşturma
```
https://your-domain.com/api/webhooks/retell/appointment
```

### Randevu İptal Etme
```
https://your-domain.com/api/webhooks/retell/cancel
```

## 🤖 3. Retell AI Konfigürasyonu

### 3.1 Agent Oluşturma

1. Retell AI Dashboard'a gidin
2. "Create Agent" butonuna tıklayın
3. Agent ayarlarını yapılandırın:

```json
{
  "agent_name": "Medical Appointment Bot",
  "language": "Turkish",
  "voice": "Turkish Female",
  "conversation_flow": "appointment_booking"
}
```

### 3.2 Conversation Flow

Retell AI'da şu conversation flow'u kullanın:

```
1. Greeting: "Merhaba! Randevu oluşturmak için arayan kişi misiniz?"

2. Patient Info Collection:
   - "Adınızı ve soyadınızı söyler misiniz?"
   - "Telefon numaranızı alabilir miyim?"
   - "TC kimlik numaranızı söyler misiniz?"

3. Doctor Selection:
   - "Hangi doktorla randevu almak istiyorsunuz?"
   - Available doctors listesi

4. Date/Time Selection:
   - "Hangi tarihte randevu almak istiyorsunuz?"
   - "Hangi saatte uygun olursunuz?"

5. Confirmation:
   - "Randevunuzu onaylıyor musunuz?"
   - "Randevu oluşturuldu. Teşekkürler!"
```

### 3.3 Webhook Configuration

Retell AI Dashboard'da:

1. **Webhook URL**: `https://your-domain.com/api/webhooks/retell/appointment`
2. **HTTP Method**: POST
3. **Headers**: 
   - `Content-Type: application/json`
   - `x-retell-secret: your_webhook_secret`
4. **Payload Format**:

```json
{
  "doctor_id": "selected_doctor_id",
  "caller_number": "+905551234567",
  "patient_first_name": "Ahmet",
  "patient_last_name": "Yılmaz",
  "patient_tc_number": "12345678901",
  "requested_date": "2024-01-15",
  "requested_time": "14:30"
}
```

## 📞 4. Inbound Call Setup

### 4.1 Phone Number Configuration

1. Retell AI'da phone number satın alın
2. Agent'ı phone number'a assign edin
3. Webhook URL'lerini configure edin

### 4.2 Call Flow

```
Caller → Retell AI → Webhook → Your App → Database
```

## 🔒 5. Security

### 5.1 Webhook Secret

```javascript
// Webhook doğrulama
const retellSecret = process.env.RETELL_WEBHOOK_SECRET;
const providedSecret = request.headers.get('x-retell-secret');

if (!retellSecret || providedSecret !== retellSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 5.2 Data Validation

- Phone number format validation
- TC kimlik number validation (11 digits)
- Date/time validation
- Doctor availability check

## 🧪 6. Testing

### 6.1 Local Testing

```bash
# Webhook'u test etmek için
curl -X POST http://localhost:3000/api/webhooks/retell/appointment \
  -H "Content-Type: application/json" \
  -H "x-retell-secret: your_secret" \
  -d '{
    "doctor_id": "doctor_id_here",
    "caller_number": "+905551234567",
    "patient_first_name": "Test",
    "patient_last_name": "User",
    "patient_tc_number": "12345678901",
    "requested_date": "2024-01-15",
    "requested_time": "14:30"
  }'
```

### 6.2 Production Testing

1. Retell AI'da test call yapın
2. Webhook logs'ları kontrol edin
3. Database'de randevu oluştuğunu doğrulayın

## 📊 7. Monitoring

### 7.1 Webhook Logs

```javascript
console.log('Webhook received:', {
  timestamp: new Date().toISOString(),
  payload: body,
  headers: Object.fromEntries(request.headers.entries())
});
```

### 7.2 Error Handling

```javascript
try {
  // Webhook processing
} catch (error) {
  console.error('Webhook error:', error);
  return NextResponse.json(
    { status: 'error', message: error.message },
    { status: 400 }
  );
}
```

## 🚀 8. Deployment

### 8.1 Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod

# Environment variables'ları Vercel'de set edin
vercel env add RETELL_WEBHOOK_SECRET
```

### 8.2 Firebase Hosting

```bash
# Build and deploy
npm run build
firebase deploy --only hosting
```

## 📱 9. Mobile Integration

Retell AI SDK'sını mobile app'inize entegre edebilirsiniz:

```javascript
// React Native example
import { RetellAI } from 'retell-ai-sdk';

const retell = new RetellAI({
  apiKey: 'your_api_key',
  webhookUrl: 'https://your-domain.com/api/webhooks/retell/appointment'
});
```

## 🔄 10. Callback Handling

### 10.1 Success Callback

```javascript
return NextResponse.json({
  status: 'accepted',
  appointment_id: appointmentRef.id,
  booked_date: requested_date,
  booked_time: requested_time,
  message: 'Randevunuz başarıyla oluşturuldu!'
});
```

### 10.2 Error Callback

```javascript
return NextResponse.json({
  status: 'error',
  message: 'Randevu oluşturulamadı. Lütfen tekrar deneyin.',
  error_code: 'SLOT_UNAVAILABLE'
});
```

## 📞 11. Customer Support

### 11.1 Common Issues

1. **Webhook not receiving calls**: URL ve secret kontrolü
2. **Invalid phone format**: Phone number validation
3. **Doctor not found**: Doctor ID kontrolü
4. **Time slot conflict**: Availability check

### 11.2 Debugging

```javascript
// Enable detailed logging
console.log('Full request:', {
  method: request.method,
  url: request.url,
  headers: Object.fromEntries(request.headers.entries()),
  body: await request.text()
});
```

## 🎯 12. Best Practices

1. **Rate Limiting**: Webhook'lar için rate limiting uygulayın
2. **Idempotency**: Duplicate call'ları handle edin
3. **Retry Logic**: Failed webhook'lar için retry mekanizması
4. **Monitoring**: Webhook performance'ını monitor edin
5. **Backup**: Critical data için backup stratejisi

## 📈 13. Analytics

Retell AI Dashboard'da şu metrikleri takip edin:

- Call success rate
- Average call duration
- Appointment booking rate
- Customer satisfaction
- Webhook response time

---

## 🆘 Support

Herhangi bir sorun yaşarsanız:

1. **Retell AI Documentation**: [docs.retellai.com](https://docs.retellai.com)
2. **GitHub Issues**: Repository'de issue açın
3. **Email Support**: support@retellai.com

---

**Not**: Bu rehber, Retell AI entegrasyonu için temel adımları içerir. Production environment'da ek güvenlik ve monitoring önlemleri alınması önerilir.
