# 🇺🇿 Wordle O‘zbekcha (So‘ztop)

Mashhur **The New York Times (NYT) Wordle** o‘yinining o‘zbek tilidagi to‘liq va zamonaviy talqini. Ushbu o‘yin 100% mijoz tomonida (Client-side HTML5, CSS3, JavaScript) ishlaydi va **GitHub Pages** orqali hech qanday server yoki murakkab sozlamalarsiz internetga bepul joylanadi.

---

## ✨ Imkoniyatlar va Xususiyatlar

- 🎯 **Asl NYT Wordle qoidalari:** 5 harfli so‘zni 6 ta urinishda topish.
- 🔤 **Boy o‘zbekcha so‘zlar bazasi:** Minglab 5 harfli o‘zbekcha so‘zlar va har kun uchun maxsus yashirin so‘zlar.
- 📅 **Kunlik o‘yin (Daily Mode):** Har kuni yarim tunda barcha o‘yinchilar uchun yagona yangi so‘z chiqadi.
- ⚡ **Erkin rejim (Practice / Free Play):** Cheksiz xohlagancha yangi so‘zlar bilan mashq qilish imkoniyati.
- 🎨 **Dizayn va mavzular:**
  - Qorong‘i mavzu (Dark Theme - klassik Wordle foni)
  - Yorug‘ mavzu (Light Theme)
  - Yuqori kontrast (High Contrast - rang ajratishga qulay to‘q sariq va moviy ranglar)
- 📊 **To‘liq Statistika va Gistogramma:**
  - O‘yinlar soni, g‘alaba foizi, joriy va maksimal rekord seriyalar.
  - 1 tadan 6 tagacha urinishlar taqsimoti grafikasi.
- ⏰ **Taymer:** Keyingi kunlik so‘z chiqishigacha qolgan vaqtni real vaqtda ko‘rsatib turadi.
- 📋 **Ulashish (Share):** Natijani xuddi NYT Wordle kabi chiroyli emojilar (🟩🟨⬛) bilan do‘stlarga nusxalash.
- 🔊 **Tovush effektlari (Web Audio API):** Klaviatura chertilishi, kataklar ochilishi va g‘alaba sadosi (istalgan vaqtda o‘chirib-yoqish mumkin).
- 📱 **100% Moslashuvchan (Responsive):** Smartfon, planshet va kompyuter ekranlariga to‘liq moslashgan, sensorli virtual klaviatura va jismoniy klaviaturani qo‘llab-quvvatlaydi.
- 🧠 **Qiyin rejim (Hard Mode):** Topilgan harflarni keyingi taxminlarda majburiy ishlatish qoidasi.

---

## 🚀 GitHub orqali internetga chiqarish (GitHub Pages)

O‘yinni do‘stlaringiz bilan o‘ynash uchun GitHub Pages orqali bir daqiqada bepul jonli saytga aylantirishingiz mumkin.

### 1-USUL: To‘g‘ridan-to‘g‘ri brauzer orqali (Hech qanday dastursiz)

1. [GitHub.com](https://github.com) ga kiring va o‘z akkauntingizga kiring (agar bo‘lmasa, ro‘yxatdan o‘ting).
2. Yuqori o‘ng burchakdagi **`+`** belgisini bosib, **`New repository`** tugmasini bosing.
3. Repository nomini kiriting (masalan: `wordle-uzbek` yoki `soztop`), uni **Public** qilib tanlang va **`Create repository`** tugmasini bosing.
4. Ochilgan sahifada **`uploading an existing file`** havolasini bosing.
5. Ushbu papkadagi quyidagi barcha fayllarni GitHub oynasiga sudrab tashlang (Drag & Drop):
   - `index.html`
   - `style.css`
   - `app.js`
   - `words.js`
   - `README.md`
6. Sahifa pastidagi **`Commit changes`** tugmasini bosing.
7. Endi omborning yuqori menyusidagi **`Settings`** (Sozlamalar) bo‘limiga kiring.
8. Chap tomondagi menyudan **`Pages`** bo‘limini tanlang.
9. **`Branch`** bo‘limida `None` o‘rniga **`main`** (yoki `master`) ni tanlang va **`Save`** tugmasini bosing.
10. Bir necha daqiqadan so‘ng sizga shaxsiy veb-havolangiz beriladi:
    ```
    https://<sizning-github-nomingiz>.github.io/wordle-uzbek/
    ```

---

### 2-USUL: Git buyruqlari orqali (Terminalda)

Agar kompyuteringizda Git o‘rnatilgan bo‘lsa, ushbu papkada quyidagi buyruqlarni ketma-ket bajaring:

```bash
git init
git add .
git commit -m "Wordle O'zbekcha dastlabki versiya"
git branch -M main
git remote add origin https://github.com/<sizning-github-nomingiz>/wordle-uzbek.git
git push -u origin main
```

So‘ngra GitHub repository sahifasidagi **Settings -> Pages** bo‘limidan `main` branchini tanlab saqlang.

---

## 💻 Kompyuterda sinab ko‘rish

Hech narsa o‘rnatish shart emas! Shunchaki `index.html` faylini istalgan brauzerda (Google Chrome, Safari, Edge, Firefox) ikki marta bosib ochsangiz, o‘yin darhol ishga tushadi.

---

## 📁 Fayllar tuzilishi

```text
├── index.html     # Asosiy HTML interfeysi, modallar va menyular
├── style.css      # NYT Wordle uslubidagi barcha dizayn, mavzular va animatsiyalar
├── words.js       # 5 harfli saralangan o'zbekcha so'zlar ro'yxati
├── app.js         # O'yin dvigateli (qoidalar, hisoblash, animatsiyalar, statistika)
└── README.md      # Qo'llanma va o'rnatish yo'riqnomasi
```

---

## 🎮 Qanday o‘ynaladi?

1. 5 harfli o‘zbekcha so‘zni kiritib, **ENTER** tugmasini bosing.
2. Kataklar rangi quyidagicha o‘zgaradi:
   - 🟩 **Yashil:** Harf to‘g‘ri topilgan va o‘z o‘rnida joylashgan.
   - 🟨 **Sariq:** Harf so‘zda mavjud, ammo boshqa katakda turishi kerak.
   - ⬛ **Kulrang:** Harf yashirin so‘zda umuman yo‘q.
3. 6 ta urinish ichida so‘zni topishga harakat qiling!
