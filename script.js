function formatNumber(num) {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Fungsi untuk menghilangkan thousand separator (titik)
function unformatNumber(str) {
  return str.replace(/\./g, "");
}

function toTerbilang(nilai) {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
  const satuan = ["", "Ribu", "Juta", "Miliar", "Triliun"];

  if (nilai == 0) return "Nol Rupiah";
  // Anda bisa menambahkan penanganan untuk angka negatif jika diperlukan, contoh:
  // if (nilai < 0) return "Minus " + toTerbilang(Math.abs(nilai)).replace(" Rupiah", "") + " Rupiah";

  let strNilai = nilai.toString();
  let hasilAkhir = "";
  let posisiSatuan = 0; // 0 untuk satuan dasar, 1 untuk ribuan, 2 untuk jutaan, dst.

  while (strNilai.length > 0) {
    let grupTigaDigit = parseInt(strNilai.slice(-3)); // Ambil 3 digit terakhir
    strNilai = strNilai.slice(0, -3);    // Sisa string setelah diambil 3 digit

    if (grupTigaDigit > 0) {
      let segmenTeks = "";
      let ratusan = Math.floor(grupTigaDigit / 100);
      let sisaSetelahRatusan = grupTigaDigit % 100;
      let puluhan = Math.floor(sisaSetelahRatusan / 10);
      let satuanDigit = sisaSetelahRatusan % 10;

      // Konversi Ratusan
      if (ratusan > 0) {
        if (ratusan === 1) {
          segmenTeks += "Seratus "; // Mengubah "Satu Ratus" menjadi "Seratus"
        } else {
          segmenTeks += angka[ratusan] + " Ratus ";
        }
      }

      // Konversi Puluhan dan Satuan
      if (puluhan > 1) { // Untuk 20-99
        segmenTeks += angka[puluhan] + " Puluh ";
        if (satuanDigit > 0) {
          segmenTeks += angka[satuanDigit] + " ";
        }
      } else if (puluhan === 1) { // Untuk 10-19
        if (satuanDigit === 0) {
          segmenTeks += "Sepuluh "; // "Satu Puluh" menjadi "Sepuluh"
        } else if (satuanDigit === 1) {
          segmenTeks += "Sebelas "; // Tetap "Sebelas"
        } else {
          segmenTeks += angka[satuanDigit] + " Belas ";
        }
      } else { // Untuk 0-9 (ketika puluhan adalah 0)
        if (satuanDigit > 0) {
          segmenTeks += angka[satuanDigit] + " ";
        }
      }
      
      segmenTeks = segmenTeks.trim(); // Menghilangkan spasi berlebih di akhir segmen

      if (segmenTeks !== "") {
        let namaSatuan = satuan[posisiSatuan];
        // Mengubah "Satu Ribu" menjadi "Seribu"
        if (segmenTeks === "Satu" && namaSatuan === "Ribu") {
          hasilAkhir = "Seribu " + hasilAkhir;
        } else {
          hasilAkhir = segmenTeks + (namaSatuan ? " " + namaSatuan : "") + " " + hasilAkhir;
        }
      }
    }
    posisiSatuan++;
  }
  // Membersihkan spasi ganda dan spasi di awal/akhir, lalu menambahkan "Rupiah"
  return hasilAkhir.trim().replace(/\s+/g, ' ') + " Rupiah";
}

function formatTanggalIndonesia(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return ""; // Kembalikan string kosong jika input tidak valid
  }
  // Memecah tanggal dari format YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return dateString; // Jika format tidak sesuai, kembalikan string asli
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // Bulan adalah 1-12
  const day = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return dateString; // Jika parsing gagal, kembalikan string asli
  }

  const bulanIndonesia = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  if (month < 1 || month > 12) {
      return dateString; // Bulan tidak valid
  }

  return `${day} ${bulanIndonesia[month - 1]} ${year}`;
}

function formToJSON(form) {
  const data = new FormData(form);
  const result = {};

  for (const [name, value] of data.entries()) {
    const keys = name
      .replace(/\]/g, "")           // hilangkan ]
      .split(/\[|\./)               // pisah dengan [ dan .
      .filter((k) => k);            // buang elemen kosong

    let cur = result;
    keys.forEach((key, i) => {
      const isLast = i === keys.length - 1;
      const nextKey = keys[i + 1];

      // Jika key berikut angka → array
      if (!isLast) {
        if (!cur[key]) {
          cur[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        cur = cur[key];
      } else {
        cur[key] = value;
      }
    });
  }

  // --- PEMFORMATAN TANGGAL ---
  // Sesuaikan path field tanggal di bawah ini sesuai dengan struktur data Anda
  // Contoh: jika Anda memiliki input <input type="date" name="perjalanan[tgl_mulai]">
  // maka path di 'result' akan menjadi result.perjalanan.tgl_mulai

  if (result.perjalanan) {
    if (result.perjalanan.tgl_mulai) {
      result.perjalanan.tgl_mulai = formatTanggalIndonesia(result.perjalanan.tgl_mulai);
    }
    if (result.perjalanan.tgl_selesai) {
      result.perjalanan.tgl_selesai = formatTanggalIndonesia(result.perjalanan.tgl_selesai);
    }
    if (result.validasi && result.validasi.tanggal) {
      result.validasi.tanggal = formatTanggalIndonesia(result.validasi.tanggal);
    }
  }
  // Contoh lain jika ada field tanggal di level lain:
  // if (result.surat_dinas && result.surat_dinas.tanggal_surat) {
  //   result.surat_dinas.tanggal_surat = formatTanggalIndonesia(result.surat_dinas.tanggal_surat);
  // }
  // --- AKHIR PEMFORMATAN TANGGAL ---

  // Tambahkan kalkulasi total dan terbilang
  let grandTotalCalculated = 0;

  // Kalkulasi untuk item tagihan (billing)
  if (result.billing && Array.isArray(result.billing)) {
    result.billing.forEach(item => {
      if (item && typeof item === 'object') { // Pastikan item adalah objek yang valid
        const nom = parseInt(unformatNumber(item.harian_nom || "0"), 10);
        const vol = parseInt(item.harian_vol || "0", 10);
        item.harian_total = nom * vol;
        item.harian_nom_display = formatNumber(nom);
        item.harian_total_display = formatNumber(item.harian_total);
        item.harian_total_terbilang = toTerbilang(item.harian_total);
        grandTotalCalculated += item.harian_total;
      }
    });
  }

  // Kalkulasi untuk transportasi (jika ada)
  if (result.transport && typeof result.transport === 'object' && result.transport.nom) {
    const nom = parseInt(unformatNumber(result.transport.nom || "0"), 10);
    const vol = parseInt(result.transport.vol || "1", 10);
    result.transport.total = nom * vol;
    result.transport.nom_display = formatNumber(nom);
    result.transport.total_display = formatNumber(result.transport.total);
    result.transport_total_terbilang = toTerbilang(result.transport.total);
    grandTotalCalculated += result.transport.total;
  }

  // Total Keseluruhan
  result.grand_total_display = formatNumber(grandTotalCalculated);
  result.grand_total_terbilang = toTerbilang(grandTotalCalculated);

  return result;
}
// Fungsi untuk mengubah objek bersarang menjadi objek datar dengan notasi titik
function flattenObject(obj, parentKey = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        // Rekursif untuk objek (termasuk array, di mana kunci akan menjadi indeks atau properti array)
        flattenObject(value, newKey, result);
      } else {
        // Nilai primitif atau null
        result[newKey] = value;
      }
    }
  }
  return result;
}


document.getElementById("previewBtn").addEventListener("click", () => {
  const originalData = formToJSON(document.getElementById("dopForm"));
  // Ubah data menjadi format datar sebelum ditampilkan
  const flattenedData = flattenObject(originalData);
  document.getElementById("previewJson").textContent = JSON.stringify(flattenedData, null, 2);
});


document.getElementById("dopForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const nestedData = formToJSON(this); // Data asli dari formToJSON (bersarang)
  console.log("Data Bersarang (sebelum diratakan):", JSON.stringify(nestedData, null, 2)); // TAMBAHKAN INI UNTUK DEBUG
  
  // Ratakan data agar sesuai dengan output tombol "Preview JSON"
  const jsonDataForDocx = flattenObject(nestedData); 


  // Tampilkan struktur JSON yang akan dikirim di konsol dan di area preview
  console.log("Struktur JSON yang dikirim untuk DOCX:", jsonDataForDocx);
  document.getElementById("previewJson").textContent = JSON.stringify(jsonDataForDocx, null, 2); // Sekarang menampilkan data yang sudah diratakan
  // Jika Anda menggunakan modal untuk previewJson, Anda mungkin perlu menampilkannya secara programatik di sini
  // contoh: new bootstrap.Modal(document.getElementById('idModalPreview')).show();

  // Ambil file template dari input
  const templateFileInput = document.getElementById("templateFile");
  if (!templateFileInput || !templateFileInput.files || templateFileInput.files.length === 0) {
    alert("Silakan pilih file template DOCX terlebih dahulu.");
    return; // Hentikan eksekusi jika tidak ada file template yang dipilih
  }
  const templateFile = templateFileInput.files[0];

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const content = event.target.result; // Ini akan menjadi ArrayBuffer
      const zip = new PizZip(content);
      const doc = new window.docxtemplater().loadZip(zip);
      doc.setData(jsonDataForDocx);

      try {
        doc.render();
      } catch (error) {
        console.error("Docxtemplater render error: ", error);
        if (error.properties && error.properties.errors) {
            error.properties.errors.forEach(err => {
                console.error("Template Error Detail:", err.stack || err.message || err);
            });
        }
        alert("Terjadi kesalahan saat memproses template: " + error.message + "\nLihat konsol untuk detail.");
        return;
      }

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(out, "kwitansi_dinas.docx");
    } catch (e) {
      console.error("Error processing template file: ", e);
      alert("Gagal memproses file template: " + e.message);
    }
  };

  reader.onerror = function (event) {
    console.error("File reading error: ", event.target.error);
    alert("Gagal membaca file template.");
  };

  // Baca file template sebagai ArrayBuffer
  reader.readAsArrayBuffer(templateFile);
});
