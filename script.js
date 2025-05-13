function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toTerbilang(nilai) {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
  const satuan = ["", "Ribu", "Juta", "Miliar", "Triliun"];
  if (nilai == 0) return "Nol Rupiah";
  let str = nilai.toString(), res = "", pos = 0;
  while (str.length > 0) {
    let tiga = parseInt(str.slice(-3));
    str = str.slice(0, -3);
    if (tiga) {
      let r = Math.floor(tiga / 100);
      let p = Math.floor((tiga % 100) / 10);
      let s = tiga % 10;
      let seg = "";
      if (r) seg += angka[r] + " Ratus ";
      if (p > 1) seg += angka[p] + " Puluh " + angka[s] + " ";
      else if (p == 1) seg += s == 0 ? "Sepuluh " : s == 1 ? "Sebelas " : angka[s] + " Belas ";
      else if (s) seg += angka[s] + " ";
      res = seg + satuan[pos] + " " + res;
    }
    pos++;
  }
  return res.trim() + " Rupiah";
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
        const nom = parseInt((item.harian_nom || "0").replace(/,/g, ""), 10);
        const vol = parseInt((item.harian_vol || "0"), 10);
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
    const nom = parseInt((result.transport.nom || "0").replace(/,/g, ""), 10);
    const vol = parseInt((result.transport.vol || "1"), 10); // Asumsi vol=1 jika tidak ada
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

  const res = await fetch("template/template.docx");
  const blob = await res.blob();
  const reader = new FileReader();

  reader.onload = function () {
    const zip = new PizZip(reader.result);
    const doc = new window.docxtemplater().loadZip(zip);
    doc.setData(jsonDataForDocx);
    try {
      doc.render();
    } catch (error) {
      alert("Template error: " + error.message);
      return;
    }
    const out = doc.getZip().generate({ type: "blob" });
    saveAs(out, "kwitansi_dinas.docx");
  };

  reader.readAsBinaryString(blob);
});
