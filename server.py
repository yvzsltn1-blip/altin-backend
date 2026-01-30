"""
ALTIN FİYATI API SUNUCUSU
=========================
Bu dosya arkaplanda çalışır ve altin.in'den gram altın SATIŞ fiyatı çeker.

Özellikler:
- Bugünün tarihi için: ana sayfa (https://altin.in/) kullanılır
- Geçmiş tarihler için: arsiv formatı (/arsiv/YYYY/MM/DD) kullanılır
- Her zaman SATIŞ fiyatı çekilir (alış değil)

Çalıştırmak için terminalde:
    python server.py

Sonra tarayıcıda test et:
    http://localhost:5000/api/altin/2024/08/19
"""
import os # En tepeye ekle
from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from datetime import datetime, date
import re

# Flask uygulamasını oluştur
app = Flask(__name__)

# CORS'u aç - React'ın bu sunucuya istek atmasına izin ver
CORS(app)


def bugun_mu(yil, ay, gun):
    """Verilen tarihin bugün olup olmadığını kontrol eder"""
    bugun = date.today()
    return bugun.year == yil and bugun.month == ay and bugun.day == gun


def ana_sayfadan_satis_fiyati_cek():
    """
    altin.in ana sayfasından güncel gram altın SATIŞ fiyatını çeker.
    Bugünün fiyatı için kullanılır.
    
    Sayfa yapısı:
    - Gram Altın Fiyatları (link)
    - 7281.0780 (Alış)
    - 7343.4970 (Satış)
    """
    url = "https://altin.in/"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers)
        response.encoding = 'iso-8859-9'
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Yöntem 1: "Gram Altın Fiyatları" linkini bul
        # Link yapısı: <a href="https://altin.in/fiyat/gram-altin">Gram Altın Fiyatları</a>
        gram_link = soup.find('a', href=lambda x: x and '/fiyat/gram-altin' in x)
        
        if gram_link:
            # Parent li'yi bul
            parent_li = gram_link.find_parent('li')
            if parent_li:
                # Sonraki 2 li'de alış ve satış var
                next_li = parent_li.find_next_sibling('li')  # Alış
                if next_li:
                    satis_li = next_li.find_next_sibling('li')  # Satış
                    if satis_li:
                        satis_text = satis_li.get_text().strip()
                        try:
                            fiyat = float(satis_text)
                            if fiyat > 100:
                                return {
                                    "basarili": True,
                                    "tarih": date.today().strftime("%Y/%m/%d"),
                                    "gram_altin": fiyat,
                                    "tip": "satis",
                                    "kaynak": url
                                }
                        except:
                            pass
        
        # Yöntem 2: Regex ile sayfada ara
        # Format: Gram Altın Fiyatları 7281.0780 7343.4970
        page_text = soup.get_text()
        
        # İki ardışık ondalıklı sayıyı bul (alış ve satış)
        pattern = r'Gram\s*Alt[ıi]n\s*Fiyatlar[ıi]\s*([\d.]+)\s*([\d.]+)'
        match = re.search(pattern, page_text, re.IGNORECASE)
        
        if match:
            # İkinci sayı satış fiyatı
            satis_fiyat = float(match.group(2))
            if satis_fiyat > 100:
                return {
                    "basarili": True,
                    "tarih": date.today().strftime("%Y/%m/%d"),
                    "gram_altin": satis_fiyat,
                    "tip": "satis",
                    "kaynak": url
                }
        
        # Yöntem 3: Tüm li'leri tara ve gram-altin içeren linki bul
        all_li = soup.find_all('li')
        for i, li in enumerate(all_li):
            link = li.find('a', href=lambda x: x and 'gram-altin' in str(x) and 'fiyat' in str(x))
            if link and 'Gram' in li.get_text():
                # Sonraki 2 li'de alış ve satış var
                if i + 2 < len(all_li):
                    satis_text = all_li[i + 2].get_text().strip()
                    try:
                        fiyat = float(satis_text)
                        if fiyat > 100:
                            return {
                                "basarili": True,
                                "tarih": date.today().strftime("%Y/%m/%d"),
                                "gram_altin": fiyat,
                                "tip": "satis",
                                "kaynak": url
                            }
                    except:
                        pass
        
        # Yöntem 4: Header'daki GRAM fiyatını al (fallback)
        # [GRAM](https://yorum.altin.in/tum/gram-altin) **7343.7555**
        gram_header = soup.find('a', href=lambda x: x and 'yorum.altin.in/tum/gram-altin' in str(x))
        if gram_header:
            parent = gram_header.find_parent()
            if parent:
                text = parent.get_text()
                numbers = re.findall(r'[\d.]+', text)
                for num in numbers:
                    try:
                        fiyat = float(num)
                        if fiyat > 1000:  # Gram altın 1000 TL'den fazla olmalı
                            return {
                                "basarili": True,
                                "tarih": date.today().strftime("%Y/%m/%d"),
                                "gram_altin": fiyat,
                                "tip": "satis",
                                "kaynak": url
                            }
                    except:
                        pass
        
        return {
            "basarili": False,
            "hata": "Ana sayfadan gram altın satış fiyatı bulunamadı",
            "tarih": date.today().strftime("%Y/%m/%d"),
            "kaynak": url
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "basarili": False,
            "hata": f"Site bağlantı hatası: {str(e)}",
            "tarih": date.today().strftime("%Y/%m/%d")
        }
    except Exception as e:
        return {
            "basarili": False,
            "hata": f"Hata: {str(e)}",
            "tarih": date.today().strftime("%Y/%m/%d")
        }


def arsivden_satis_fiyati_cek(yil, ay, gun):
    """
    altin.in arşiv sayfasından gram altın SATIŞ fiyatını çeker.
    Geçmiş tarihler için kullanılır.
    """
    
    url = f"https://altin.in/arsiv/{yil}/{ay:02d}/{gun:02d}"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers)
        response.encoding = 'iso-8859-9'
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Yöntem 1: Gram Altın linkini bul ve SATIŞ fiyatını al
        # Arşiv sayfasında: İsim linki | Alış | Satış formatında
        gram_link = soup.find('a', href=lambda x: x and 'gram-altin' in x and 'arsiv-fiyat' in x)
        
        if gram_link:
            parent_li = gram_link.find_parent('li')
            if parent_li:
                # Sonraki li'lerde fiyatlar var
                # İlk li = Alış, İkinci li = Satış
                next_li = parent_li.find_next_sibling('li')  # Alış
                if next_li:
                    satis_li = next_li.find_next_sibling('li')  # Satış
                    if satis_li:
                        fiyat_text = satis_li.get_text().strip()
                        fiyat = float(fiyat_text)
                        
                        return {
                            "basarili": True,
                            "tarih": f"{yil}/{ay:02d}/{gun:02d}",
                            "gram_altin": fiyat,
                            "tip": "satis",
                            "kaynak": url
                        }
                    else:
                        # Eğer satış fiyatı bulunamazsa alış fiyatını al (fallback)
                        fiyat_text = next_li.get_text().strip()
                        fiyat = float(fiyat_text)
                        
                        return {
                            "basarili": True,
                            "tarih": f"{yil}/{ay:02d}/{gun:02d}",
                            "gram_altin": fiyat,
                            "tip": "alis_fallback",
                            "kaynak": url
                        }
        
        # Yöntem 2: Regex ile tüm sayfada ara
        page_text = soup.get_text()
        
        # Gram Altın satırındaki ikinci fiyatı (satış) bul
        pattern = r'Gram\s*Alt[ıi]n[^\d]*([\d.]+)[^\d]*([\d.]+)'
        match = re.search(pattern, page_text, re.IGNORECASE)
        
        if match:
            # İkinci grup satış fiyatı
            satis_fiyat = float(match.group(2)) if match.group(2) else float(match.group(1))
            return {
                "basarili": True,
                "tarih": f"{yil}/{ay:02d}/{gun:02d}",
                "gram_altin": satis_fiyat,
                "tip": "satis",
                "kaynak": url
            }
        
        # Yöntem 3: Tüm li'leri tara
        all_li = soup.find_all('li')
        for i, li in enumerate(all_li):
            link = li.find('a', href=lambda x: x and 'gram-altin' in str(x))
            if link:
                # Sonraki 2 li'de alış ve satış var
                if i + 2 < len(all_li):
                    satis_text = all_li[i + 2].get_text().strip()
                    try:
                        fiyat = float(satis_text)
                        return {
                            "basarili": True,
                            "tarih": f"{yil}/{ay:02d}/{gun:02d}",
                            "gram_altin": fiyat,
                            "tip": "satis",
                            "kaynak": url
                        }
                    except:
                        # Satış bulunamazsa alışı dene
                        if i + 1 < len(all_li):
                            alis_text = all_li[i + 1].get_text().strip()
                            try:
                                fiyat = float(alis_text)
                                return {
                                    "basarili": True,
                                    "tarih": f"{yil}/{ay:02d}/{gun:02d}",
                                    "gram_altin": fiyat,
                                    "tip": "alis_fallback",
                                    "kaynak": url
                                }
                            except:
                                pass
        
        return {
            "basarili": False,
            "hata": "Gram altın satış fiyatı bulunamadı",
            "tarih": f"{yil}/{ay:02d}/{gun:02d}",
            "kaynak": url
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "basarili": False,
            "hata": f"Site bağlantı hatası: {str(e)}",
            "tarih": f"{yil}/{ay:02d}/{gun:02d}"
        }
    except Exception as e:
        return {
            "basarili": False,
            "hata": f"Hata: {str(e)}",
            "tarih": f"{yil}/{ay:02d}/{gun:02d}"
        }


def altin_satis_fiyati_cek(yil, ay, gun):
    """
    Gram altın SATIŞ fiyatını çeker.
    - Bugün için: ana sayfa kullanılır
    - Geçmiş için: arşiv sayfası kullanılır
    """
    
    if bugun_mu(yil, ay, gun):
        # Bugün - ana sayfadan çek
        return ana_sayfadan_satis_fiyati_cek()
    else:
        # Geçmiş tarih - arşivden çek
        return arsivden_satis_fiyati_cek(yil, ay, gun)


# =============================================================================
# API ENDPOINT'LERİ (React bu adreslere istek atacak)
# =============================================================================

@app.route('/')
def ana_sayfa():
    """Ana sayfa - API'nin çalıştığını gösterir"""
    return jsonify({
        "mesaj": "Altın Fiyatı API'si çalışıyor!",
        "kullanim": "/api/altin/YIL/AY/GUN",
        "ornek": "/api/altin/2024/08/19",
        "not": "Her zaman SATIŞ fiyatı döner. Bugün için ana sayfa, geçmiş için arşiv kullanılır."
    })


@app.route('/api/altin/<int:yil>/<int:ay>/<int:gun>')
def altin_api(yil, ay, gun):
    """
    Belirli bir tarihteki gram altın SATIŞ fiyatını döner.
    
    Örnek: GET /api/altin/2024/08/19
    
    Bugünün tarihi için ana sayfa, geçmiş tarihler için arşiv kullanılır.
    """
    sonuc = altin_satis_fiyati_cek(yil, ay, gun)
    return jsonify(sonuc)


@app.route('/api/altin/bugun')
def bugunun_fiyati():
    """
    Bugünün gram altın SATIŞ fiyatını döner.
    Ana sayfadan çeker.
    """
    bugun = date.today()
    sonuc = altin_satis_fiyati_cek(bugun.year, bugun.month, bugun.day)
    return jsonify(sonuc)


# =============================================================================
# SUNUCUYU BAŞLAT
# =============================================================================

if __name__ == '__main__':
    print("=" * 50)
    print("🪙 ALTIN FİYATI API SUNUCUSU")
    print("=" * 50)
    print("")
    print("✨ YENİ: Artık SATIŞ fiyatı çekiliyor!")
    print("✨ YENİ: Bugün için ana sayfa kullanılıyor!")
    print("")
    print("Sunucu başlatılıyor...")
    print("")
    print("🔍 Adres: http://localhost:5000")
    print("")
    print("🧪 Test için tarayıcıda aç:")
    print("   http://localhost:5000/api/altin/bugun")
    print("   http://localhost:5000/api/altin/2024/08/19")
    print("")
    print("🛑 Durdurmak için: CTRL + C")
    print("=" * 50)
    
if __name__ == '__main__':
    # Cloud Run 'PORT' adında bir ortam değişkeni gönderir.
    # Eğer bu değişken yoksa (kendi bilgisayarında) 5000'i kullanır.
    port = int(os.environ.get('PORT', 5000))
    
    # debug=False olmalı, host='0.0.0.0' kalmalı
    app.run(debug=False, host='0.0.0.0', port=port)
