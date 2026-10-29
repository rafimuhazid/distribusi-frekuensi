// Statistika Nilai

let daftarMahasiswa = [];
let idBerikutnya = 1;

// Elemen DOM
const ambil = (id) => document.getElementById(id);

const formMahasiswa = ambil("formMahasiswa");
const inputNpm = ambil("inputNpm");
const inputNilai = ambil("inputNilai");
const tombolContoh = ambil("tombolContoh");
const tombolReset = ambil("tombolReset");
const elemenPesan = ambil("pesan");
const badanTabel = ambil("tabelMahasiswa");
const elemenTotalMahasiswa = ambil("totalMahasiswa");
const inputPersentil = ambil("inputPersentil");
const tombolPersentil = ambil("tombolHitungPersentil");
const hasilPersentil = ambil("hasilPersentil");
const inputJumlahKelas = ambil("jumlahKelas");
const inputPersentilBerkelompok = ambil("inputPersentilBerkelompok");

// Utilitas
function formatAngka(angka, digit = 2) {
    if (angka === null || angka === undefined || Number.isNaN(angka)) return "-";
    return Number(angka).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digit,
    });
}

function formatTetap(angka, digit = 2) {
    return Number(angka).toLocaleString("id-ID", {
        minimumFractionDigits: digit,
        maximumFractionDigits: digit,
    });
}

function amankanHTML(teks) {
    return teks
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function tampilkanPesan(teks, adalahGalat = true) {
    elemenPesan.textContent = teks;
    elemenPesan.className = `mt-4 text-sm ${adalahGalat ? "text-amber-400" : "text-emerald-400"}`;
}

const aturTeks = (id, nilai) => (ambil(id).textContent = nilai);
const sel = (isi, tambahan = "") => `<td class="px-3 py-2 ${tambahan}">${isi}</td>`;
const kelasBaris = (sorot) =>
    sorot ? "border-b border-slate-800 bg-amber-400/20 font-semibold text-amber-200" : "border-b border-slate-800";

// Fungsi Statistik (Data Tunggal)
function ambilNilaiTerurut() {
    return daftarMahasiswa.map((m) => m.nilai).sort((a, b) => a - b);
}

function hitungRataRata(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

// Persentil dengan interpolasi linear (setara PERCENTILE.INC di Excel)
function hitungPersentil(terurut, p) {
    if (terurut.length === 0) return null;
    if (terurut.length === 1) return terurut[0];

    const peringkat = (p / 100) * (terurut.length - 1);
    const bawah = Math.floor(peringkat);
    const atas = Math.ceil(peringkat);
    const bobot = peringkat - bawah;

    return terurut[bawah] + (terurut[atas] - terurut[bawah]) * bobot;
}

function hitungMedian(terurut) {
    return hitungPersentil(terurut, 50);
}

function hitungModus(data) {
    const frekuensi = new Map();
    data.forEach((v) => frekuensi.set(v, (frekuensi.get(v) || 0) + 1));

    const frekuensiTertinggi = Math.max(...frekuensi.values());
    if (frekuensiTertinggi === 1) return "Tidak ada modus";

    return [...frekuensi.entries()]
        .filter(([, f]) => f === frekuensiTertinggi)
        .map(([v]) => formatAngka(v))
        .join(", ");
}

function hitungJumlahKuadrat(data, rataRata) {
    // Σ(X − X̄)²
    return data.reduce((jumlah, x) => jumlah + (x - rataRata) ** 2, 0);
}

function hitungVariansSampel(data, rataRata) {
    // varians sampel: Σ(X − X̄)² / (n − 1)
    if (data.length < 2) return null;
    return hitungJumlahKuadrat(data, rataRata) / (data.length - 1);
}

function hitungKemencengan(data, rataRata, simpanganBaku) {
    if (data.length < 3 || simpanganBaku === 0) return null;
    const m3 = data.reduce((jumlah, x) => jumlah + (x - rataRata) ** 3, 0) / data.length;
    return m3 / simpanganBaku ** 3;
}

function hitungKeruncingan(data, rataRata, simpanganBaku) {
    if (data.length < 4 || simpanganBaku === 0) return null;
    const m4 = data.reduce((jumlah, x) => jumlah + (x - rataRata) ** 4, 0) / data.length;
    return m4 / simpanganBaku ** 4 - 3; // excess kurtosis
}

// Render Data Tunggal
function tampilkanTabel() {
    elemenTotalMahasiswa.textContent = `${daftarMahasiswa.length} mahasiswa`;

    if (daftarMahasiswa.length === 0) {
        badanTabel.innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-8 text-center text-slate-500">
                    Belum ada data mahasiswa.
                </td>
            </tr>`;
        return;
    }

    badanTabel.innerHTML = daftarMahasiswa
        .map(
            (m, i) => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                <td class="px-4 py-3">${i + 1}</td>
                <td class="px-4 py-3">${amankanHTML(m.npm)}</td>
                <td class="px-4 py-3 font-semibold">${formatAngka(m.nilai)}</td>
                <td class="px-4 py-3">
                    <button type="button" data-id="${m.id}"
                        class="tombol-hapus rounded bg-red-600/20 px-3 py-1 text-xs text-red-300 hover:bg-red-600/40">
                        Hapus
                    </button>
                </td>
            </tr>`
        )
        .join("");
}

function tampilkanDesil(terurut) {
    const wadah = ambil("desil");

    wadah.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const k = i + 1;
        const nilai = terurut.length ? hitungPersentil(terurut, k * 10) : null;
        return `
            <div class="rounded-lg bg-slate-800 p-4">
                <p class="text-sm text-slate-400">D${k}</p>
                <p class="mt-2 text-xl font-bold">${formatAngka(nilai)}</p>
            </div>`;
    }).join("");
}

function tampilkanStatistik() {
    const terurut = ambilNilaiTerurut();
    const n = terurut.length;

    aturTeks("jumlahData", n);

    if (n === 0) {
        ["rataRata", "median", "modus", "varians", "standarDeviasi", "kemencengan", "keruncingan", "kuartil1", "kuartil2", "kuartil3"].forEach(
            (id) => aturTeks(id, "-")
        );
        tampilkanDesil(terurut);
        hasilPersentil.textContent = `P${inputPersentil.value || "-"}: -`;
        return;
    }

    const rataRata = hitungRataRata(terurut);

    // Varians & standar deviasi sampel (dibagi n − 1)
    const varians = hitungVariansSampel(terurut, rataRata);
    const standarDeviasi = varians === null ? null : Math.sqrt(varians);

    // Kemencengan & keruncingan memakai simpangan baku populasi (dibagi n)
    const simpanganBakuPopulasi = Math.sqrt(hitungJumlahKuadrat(terurut, rataRata) / n);
    const kemencengan = hitungKemencengan(terurut, rataRata, simpanganBakuPopulasi);
    const keruncingan = hitungKeruncingan(terurut, rataRata, simpanganBakuPopulasi);

    aturTeks("rataRata", formatAngka(rataRata));
    aturTeks("median", formatAngka(hitungMedian(terurut)));
    aturTeks("modus", hitungModus(terurut));

    aturTeks("varians", varians === null ? "-" : formatAngka(varians, 4));
    aturTeks("standarDeviasi", standarDeviasi === null ? "-" : formatAngka(standarDeviasi, 4));
    aturTeks("kemencengan", kemencengan === null ? "-" : formatAngka(kemencengan, 3));
    aturTeks("keruncingan", keruncingan === null ? "-" : formatAngka(keruncingan, 3));

    aturTeks("kuartil1", formatAngka(hitungPersentil(terurut, 25)));
    aturTeks("kuartil2", formatAngka(hitungPersentil(terurut, 50)));
    aturTeks("kuartil3", formatAngka(hitungPersentil(terurut, 75)));

    tampilkanDesil(terurut);
    perbaruiPersentil();
}

function perbaruiPersentil() {
    const p = Number(inputPersentil.value);

    if (!Number.isInteger(p) || p < 1 || p > 99) {
        hasilPersentil.textContent = "P?: masukkan angka bulat 1–99";
        return;
    }

    const terurut = ambilNilaiTerurut();
    const nilai = terurut.length ? hitungPersentil(terurut, p) : null;
    hasilPersentil.textContent = `P${p}: ${formatAngka(nilai)}`;
}

function segarkan() {
    tampilkanTabel();
    tampilkanStatistik();
    tampilkanDistribusi();
}

// Distribusi Frekuensi
function hitungDesimal(angka) {
    const teks = String(angka);
    return teks.includes(".") ? teks.split(".")[1].length : 0;
}

function susunTabelDistribusi(terurut, jumlahKelas) {
    const n = terurut.length;
    const minimum = terurut[0];
    const maksimum = terurut[n - 1];

    // Satuan data: 1 untuk bilangan bulat, 0,1 untuk 1 desimal, dst.
    const desimal = Math.max(...terurut.map(hitungDesimal));
    const satuan = 10 ** -desimal;
    const bulatkan = (x) => Number(x.toFixed(desimal + 2));

    const rentang = bulatkan(maksimum - minimum);

    // Lebar kelas = Rentang / k, dibulatkan ke atas
    const lebarMentah = rentang / jumlahKelas;
    let lebar = bulatkan(Math.ceil(lebarMentah / satuan - 1e-9) * satuan);
    if (lebar < satuan) lebar = satuan;

    // Pastikan kelas terakhir benar-benar mencakup nilai maksimum
    while (bulatkan(minimum + jumlahKelas * lebar - satuan) < maksimum) lebar = bulatkan(lebar + satuan);

    const kelas = [];
    let kumulatif = 0;

    for (let i = 0; i < jumlahKelas; i++) {
        const batasBawah = bulatkan(minimum + i * lebar); // LCL
        const batasAtas = bulatkan(batasBawah + lebar - satuan); // UCL
        const tepiBawah = bulatkan(batasBawah - satuan / 2); // LCB
        const tepiAtas = bulatkan(batasAtas + satuan / 2); // UCB

        const frek = terurut.filter((x) => x > tepiBawah && x < tepiAtas).length;
        const lebihDari = n - kumulatif; // banyak data ≥ LCB
        kumulatif += frek;

        kelas.push({
            no: i + 1,
            batasBawah,
            batasAtas,
            tepiBawah,
            tepiAtas,
            titikTengah: bulatkan((batasBawah + batasAtas) / 2),
            frek,
            frekKum: kumulatif,
            frekRelatif: frek / n,
            frekKumRelatif: kumulatif / n,
            kurangDari: kumulatif,
            lebihDari,
        });
    }

    return { n, minimum, maksimum, rentang, lebarMentah, lebar, desimal, kelas };
}

function tampilkanDistribusi() {
    const terurut = ambilNilaiTerurut();
    const n = terurut.length;
    const badan = ambil("tabelDistribusi");

    // Jumlah kelas: otomatis (rumus Sturges) atau manual
    const sturges = n > 0 ? Math.min(30, Math.max(1, Math.round(1 + 3.322 * Math.log10(n)))) : null;
    const modeOtomatis = document.querySelector('input[name="modeKelas"]:checked').value === "otomatis";
    inputJumlahKelas.disabled = modeOtomatis;
    if (modeOtomatis && sturges) inputJumlahKelas.value = sturges;
    const jumlahKelas = parseInt(inputJumlahKelas.value, 10);
    aturTeks("saranSturges", sturges ? `Sturges: k = 1 + 3,322 × log10(${n}) ≈ ${sturges} kelas` : "");

    const kosongkanRingkasan = () => {
        ["distN", "distMin", "distMaks", "distRentang", "distLebarMentah", "distLebar", "totalFDistribusi", "totalFRelDistribusi"].forEach(
            (id) => aturTeks(id, "-")
        );
        kosongkanDataBerkelompok();
    };

    if (n === 0) {
        kosongkanRingkasan();
        badan.innerHTML = `
            <tr><td colspan="11" class="px-4 py-8 text-center text-slate-500">
                Belum ada data untuk dibuat tabel distribusi frekuensi.
            </td></tr>`;
        return;
    }

    if (!Number.isInteger(jumlahKelas) || jumlahKelas < 1 || jumlahKelas > 30) {
        kosongkanRingkasan();
        badan.innerHTML = `
            <tr><td colspan="11" class="px-4 py-8 text-center text-amber-400">
                Banyak kelas harus berupa bilangan bulat 1–30.
            </td></tr>`;
        return;
    }

    if (terurut[0] === terurut[n - 1]) {
        kosongkanRingkasan();
        badan.innerHTML = `
            <tr><td colspan="11" class="px-4 py-8 text-center text-amber-400">
                Semua data bernilai sama, sehingga rentang = 0 dan kelas tidak dapat dibuat.
            </td></tr>`;
        return;
    }

    const tabel = susunTabelDistribusi(terurut, jumlahKelas);
    const d = tabel.desimal;

    aturTeks("distN", tabel.n);
    aturTeks("distMin", formatAngka(tabel.minimum, d));
    aturTeks("distMaks", formatAngka(tabel.maksimum, d));
    aturTeks("distRentang", formatAngka(tabel.rentang, d));
    aturTeks("distLebarMentah", formatAngka(tabel.lebarMentah, 4));
    aturTeks("distLebar", formatAngka(tabel.lebar, d));

    badan.innerHTML = tabel.kelas
        .map(
            (k) => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                <td class="px-3 py-2">${k.no}</td>
                <td class="px-3 py-2">${formatAngka(k.batasBawah, d)}</td>
                <td class="px-3 py-2">${formatAngka(k.batasAtas, d)}</td>
                <td class="px-3 py-2">${formatAngka(k.tepiBawah, d + 1)}</td>
                <td class="px-3 py-2">${formatAngka(k.tepiAtas, d + 1)}</td>
                <td class="px-3 py-2 font-semibold">${k.frek}</td>
                <td class="px-3 py-2">${k.frekKum}</td>
                <td class="px-3 py-2">${formatTetap(k.frekRelatif, 2)}</td>
                <td class="px-3 py-2">${formatTetap(k.frekKumRelatif, 2)}</td>
                <td class="px-3 py-2">${k.kurangDari}</td>
                <td class="px-3 py-2">${k.lebihDari}</td>
            </tr>`
        )
        .join("");

    const totalFrek = tabel.kelas.reduce((jumlah, k) => jumlah + k.frek, 0);
    const totalRelatif = tabel.kelas.reduce((jumlah, k) => jumlah + k.frekRelatif, 0);
    aturTeks("totalFDistribusi", totalFrek);
    aturTeks("totalFRelDistribusi", formatTetap(totalRelatif, 2));

    tampilkanDataBerkelompok(tabel);
}

// Tabel distribusi frekuensi terakhir (dipakai ulang saat persentil diubah)
let tabelTerakhir = null;

// Kolom umum pada tiap tabel kelas: No, LCL, UCL, LCB, UCB, F
function buatKolomDasar(k, d) {
    return (
        sel(k.no) +
        sel(formatAngka(k.batasBawah, d)) +
        sel(formatAngka(k.batasAtas, d)) +
        sel(formatAngka(k.tepiBawah, d + 1)) +
        sel(formatAngka(k.tepiAtas, d + 1)) +
        sel(k.frek, "font-semibold")
    );
}

// Statistik Data Berkelompok
const DAFTAR_ID_BERKELOMPOK = [
    "sigmaFCM", "sigmaF", "hasilMean", "totalFMean", "totalFCMMean",
    "medianN", "medianNPer2", "medianLCB", "medianFkumSebelum", "medianF", "medianW", "hasilMedian", "totalFMedian",
    "modusLCB", "modusF1", "modusF0", "modusF2", "modusW", "modusF1MinF0", "modusF1MinF2", "hasilModus", "totalFModus",
    "variansMean", "variansSigmaF", "variansSigmaFD", "hasilVarians", "hasilSD", "totalFVarians", "totalFCMVarians", "totalFDVarians",
    "bentukMean", "bentukSigmaF", "bentukSigmaFD2", "bentukSigmaFD3", "bentukSigmaFD4",
    "bentukM2", "bentukSD", "bentukM3", "bentukM4",
    "hasilKemencengan", "hasilKeruncingan", "hasilKelebihanKeruncingan", "bentukInterpretasi",
    "totalFBentuk", "totalFD2Bentuk", "totalFD3Bentuk", "totalFD4Bentuk",
    "totalFKuartil", "totalFDesil", "totalFPersentil",
];
const DAFTAR_TABEL_BERKELOMPOK = [
    "tabelMean", "tabelMedian", "tabelModus", "tabelVarians", "tabelBentuk",
    "tabelKelasKuartil", "tabelHasilKuartil", "tabelKelasDesil", "tabelHasilDesil", "tabelKelasPersentil", "tabelHasilPersentil",
];
const JUMLAH_KOLOM_TABEL = {
    tabelMean: 8, tabelMedian: 7, tabelModus: 7, tabelVarians: 9, tabelBentuk: 10,
    tabelKelasKuartil: 7, tabelHasilKuartil: 8, tabelKelasDesil: 7, tabelHasilDesil: 8, tabelKelasPersentil: 7, tabelHasilPersentil: 8,
};

function kosongkanDataBerkelompok() {
    tabelTerakhir = null;
    kosongkanGrafik(); // dari tambahan.js
    DAFTAR_ID_BERKELOMPOK.forEach((id) => aturTeks(id, "-"));
    DAFTAR_TABEL_BERKELOMPOK.forEach((id) => {
        ambil(id).innerHTML = `<tr><td colspan="${JUMLAH_KOLOM_TABEL[id]}" class="px-4 py-6 text-center text-slate-500">
            Belum ada tabel distribusi frekuensi.</td></tr>`;
    });
}

function tampilkanDataBerkelompok(tabel) {
    tabelTerakhir = tabel;
    const d = tabel.desimal;
    const kelas = tabel.kelas;
    const n = tabel.n;
    const w = tabel.lebar;

    const sigmaF = kelas.reduce((a, k) => a + k.frek, 0);
    const sigmaFCM = kelas.reduce((a, k) => a + k.frek * k.titikTengah, 0);
    const rataRata = sigmaFCM / sigmaF;

    const kolomDasar = (k) => buatKolomDasar(k, d);

    // 2. MEAN
    ambil("tabelMean").innerHTML = kelas
        .map(
            (k) =>
                `<tr class="${kelasBaris(false)}">${kolomDasar(k)}${sel(formatAngka(k.titikTengah, d + 1))}` +
                `${sel(formatTetap(k.frek * k.titikTengah, 1))}</tr>`
        )
        .join("");
    aturTeks("totalFMean", sigmaF);
    aturTeks("totalFCMMean", formatTetap(sigmaFCM, 1));
    aturTeks("sigmaFCM", formatTetap(sigmaFCM, 1));
    aturTeks("sigmaF", sigmaF);
    aturTeks("hasilMean", formatTetap(rataRata, 4));

    // 3. MEDIAN
    const setengahN = n / 2;
    const indeksMedian = kelas.findIndex((k) => k.frekKum >= setengahN);
    const kelasMedian = kelas[indeksMedian];
    const frekKumSebelum = indeksMedian > 0 ? kelas[indeksMedian - 1].frekKum : 0;
    const median = kelasMedian.tepiBawah + ((setengahN - frekKumSebelum) / kelasMedian.frek) * w;

    ambil("tabelMedian").innerHTML = kelas
        .map((k, i) => `<tr class="${kelasBaris(i === indeksMedian)}">${kolomDasar(k)}${sel(k.frekKum)}</tr>`)
        .join("");
    aturTeks("totalFMedian", sigmaF);
    aturTeks("medianN", n);
    aturTeks("medianNPer2", formatAngka(setengahN, 2));
    aturTeks("medianLCB", formatAngka(kelasMedian.tepiBawah, d + 1));
    aturTeks("medianFkumSebelum", frekKumSebelum);
    aturTeks("medianF", kelasMedian.frek);
    aturTeks("medianW", formatAngka(w, d));
    aturTeks("hasilMedian", formatTetap(median, 4));

    // 4. MODUS
    const frekTertinggi = Math.max(...kelas.map((k) => k.frek));
    const indeksModus = kelas.findIndex((k) => k.frek === frekTertinggi);
    const kelasModus = kelas[indeksModus];
    const f0 = indeksModus > 0 ? kelas[indeksModus - 1].frek : 0;
    const f2 = indeksModus < kelas.length - 1 ? kelas[indeksModus + 1].frek : 0;
    const selisih1 = kelasModus.frek - f0;
    const selisih2 = kelasModus.frek - f2;
    const modus = selisih1 + selisih2 > 0 ? kelasModus.tepiBawah + (selisih1 / (selisih1 + selisih2)) * w : null;

    ambil("tabelModus").innerHTML = kelas
        .map((k, i) => `<tr class="${kelasBaris(i === indeksModus)}">${kolomDasar(k)}${sel(k.frekKum)}</tr>`)
        .join("");
    aturTeks("totalFModus", sigmaF);
    aturTeks("modusLCB", formatAngka(kelasModus.tepiBawah, d + 1));
    aturTeks("modusF1", kelasModus.frek);
    aturTeks("modusF0", f0);
    aturTeks("modusF2", f2);
    aturTeks("modusW", formatAngka(w, d));
    aturTeks("modusF1MinF0", selisih1);
    aturTeks("modusF1MinF2", selisih2);
    aturTeks("hasilModus", modus === null ? "-" : formatTetap(modus, 4));

    // 5. VARIANS & STANDAR DEVIASI
    const sigmaFD = kelas.reduce((a, k) => a + k.frek * (k.titikTengah - rataRata) ** 2, 0);
    const varians = sigmaFD / sigmaF;
    const standarDeviasi = Math.sqrt(varians);

    ambil("tabelVarians").innerHTML = kelas
        .map(
            (k) =>
                `<tr class="${kelasBaris(false)}">${kolomDasar(k)}${sel(formatAngka(k.titikTengah, d + 1))}` +
                `${sel(formatTetap(k.frek * k.titikTengah, 1))}` +
                `${sel(formatTetap(k.frek * (k.titikTengah - rataRata) ** 2, 4))}</tr>`
        )
        .join("");
    aturTeks("totalFVarians", sigmaF);
    aturTeks("totalFCMVarians", formatTetap(sigmaFCM, 1));
    aturTeks("totalFDVarians", formatTetap(sigmaFD, 4));
    aturTeks("variansMean", formatTetap(rataRata, 4));
    aturTeks("variansSigmaF", sigmaF);
    aturTeks("variansSigmaFD", formatTetap(sigmaFD, 4));
    aturTeks("hasilVarians", formatTetap(varians, 4));
    aturTeks("hasilSD", formatTetap(standarDeviasi, 4));

    // 6 – 9
    tampilkanBentukData(tabel, rataRata);
    tampilkanUkuranLetak(tabel);

    // 10 – 11: histogram, poligon, ogive (dari tambahan.js)
    gambarGrafik(tabel);
}

// Kemencengan & Keruncingan (Data Berkelompok)
function tafsirKemencengan(a) {
    if (a === null) return "tidak dapat ditentukan";
    if (Math.abs(a) < 0.05) return "mendekati simetris";
    return a > 0 ? "menceng ke kanan (positif)" : "menceng ke kiri (negatif)";
}

function tafsirKeruncingan(kelebihan) {
    if (kelebihan === null) return "tidak dapat ditentukan";
    if (Math.abs(kelebihan) < 0.05) return "mesokurtik (mendekati distribusi normal)";
    return kelebihan > 0 ? "leptokurtik (lebih runcing dari distribusi normal)" : "platikurtik (lebih landai dari distribusi normal)";
}

function tampilkanBentukData(tabel, rataRata) {
    const d = tabel.desimal;
    const kelas = tabel.kelas;
    const sigmaF = kelas.reduce((a, k) => a + k.frek, 0);

    const jumlahPangkat = (p) => kelas.reduce((a, k) => a + k.frek * (k.titikTengah - rataRata) ** p, 0);
    const sigma2 = jumlahPangkat(2);
    const sigma3 = jumlahPangkat(3);
    const sigma4 = jumlahPangkat(4);

    // Momen ke-r terhadap rata-rata: mr = Σ F (CM − Mean)^r / ΣF
    const m2 = sigma2 / sigmaF;
    const m3 = sigma3 / sigmaF;
    const m4 = sigma4 / sigmaF;
    const simpanganBaku = Math.sqrt(m2);

    const kemencengan = simpanganBaku > 0 ? m3 / simpanganBaku ** 3 : null; // α3
    const keruncingan = simpanganBaku > 0 ? m4 / simpanganBaku ** 4 : null; // α4
    const kelebihan = keruncingan === null ? null : keruncingan - 3; // excess kurtosis

    ambil("tabelBentuk").innerHTML = kelas
        .map((k) => {
            const selisihCM = k.titikTengah - rataRata;
            return (
                `<tr class="${kelasBaris(false)}">${buatKolomDasar(k, d)}${sel(formatAngka(k.titikTengah, d + 1))}` +
                `${sel(formatTetap(k.frek * selisihCM ** 2, 4))}${sel(formatTetap(k.frek * selisihCM ** 3, 4))}` +
                `${sel(formatTetap(k.frek * selisihCM ** 4, 4))}</tr>`
            );
        })
        .join("");

    aturTeks("totalFBentuk", sigmaF);
    aturTeks("totalFD2Bentuk", formatTetap(sigma2, 4));
    aturTeks("totalFD3Bentuk", formatTetap(sigma3, 4));
    aturTeks("totalFD4Bentuk", formatTetap(sigma4, 4));

    aturTeks("bentukMean", formatTetap(rataRata, 4));
    aturTeks("bentukSigmaF", sigmaF);
    aturTeks("bentukSigmaFD2", formatTetap(sigma2, 4));
    aturTeks("bentukSigmaFD3", formatTetap(sigma3, 4));
    aturTeks("bentukSigmaFD4", formatTetap(sigma4, 4));
    aturTeks("bentukM2", formatTetap(m2, 4));
    aturTeks("bentukSD", formatTetap(simpanganBaku, 4));
    aturTeks("bentukM3", formatTetap(m3, 4));
    aturTeks("bentukM4", formatTetap(m4, 4));

    aturTeks("hasilKemencengan", kemencengan === null ? "-" : formatTetap(kemencengan, 4));
    aturTeks("hasilKeruncingan", keruncingan === null ? "-" : formatTetap(keruncingan, 4));
    aturTeks("hasilKelebihanKeruncingan", kelebihan === null ? "-" : formatTetap(kelebihan, 4));
    aturTeks(
        "bentukInterpretasi",
        `Distribusi ${tafsirKemencengan(kemencengan)} dan ${tafsirKeruncingan(kelebihan)}.`
    );
}

// Kuartil, Desil, Persentil (Data Berkelompok)
function hitungUkuranLetakBerkelompok(tabel, pembagi, i) {
    const kelas = tabel.kelas;
    const posisi = (i * tabel.n) / pembagi;
    const indeks = kelas.findIndex((k) => k.frekKum >= posisi);
    const kelasUkuran = kelas[indeks];
    const frekKumSebelum = indeks > 0 ? kelas[indeks - 1].frekKum : 0;
    const nilai = kelasUkuran.tepiBawah + ((posisi - frekKumSebelum) / kelasUkuran.frek) * tabel.lebar;

    return { posisi, indeks, kelasUkuran, frekKumSebelum, nilai };
}

// Mengisi satu bagian: tabel kelas (kelas yang dipakai ditandai kuning) + tabel hasil
function isiBagianUkuranLetak(tabel, idKelas, idTotalF, idHasil, daftar, pesanKosong) {
    const d = tabel.desimal;
    const hasil = daftar.map((u) => ({ ...u, ...hitungUkuranLetakBerkelompok(tabel, u.pembagi, u.i) }));
    const dipakai = new Set(hasil.map((h) => h.indeks));

    ambil(idKelas).innerHTML = tabel.kelas
        .map((k, i) => `<tr class="${kelasBaris(dipakai.has(i))}">${buatKolomDasar(k, d)}${sel(k.frekKum)}</tr>`)
        .join("");
    aturTeks(idTotalF, tabel.kelas.reduce((a, k) => a + k.frek, 0));

    if (hasil.length === 0) {
        ambil(idHasil).innerHTML = `<tr><td colspan="8" class="px-4 py-6 text-center text-amber-400">${pesanKosong}</td></tr>`;
        return;
    }

    ambil(idHasil).innerHTML = hasil
        .map(
            (h) => `<tr class="border-b border-slate-800">
                ${sel(h.label, "font-semibold")}
                ${sel(`${h.i} × ${tabel.n} / ${h.pembagi} = ${formatAngka(h.posisi, 2)}`)}
                ${sel(h.kelasUkuran.no)}
                ${sel(formatAngka(h.kelasUkuran.tepiBawah, d + 1))}
                ${sel(h.frekKumSebelum)}
                ${sel(h.kelasUkuran.frek)}
                ${sel(formatAngka(tabel.lebar, d))}
                ${sel(formatTetap(h.nilai, 4), "font-bold text-blue-300")}
            </tr>`
        )
        .join("");
}

function tampilkanPersentilBerkelompok(tabel) {
    const p = Number(inputPersentilBerkelompok.value);
    const valid = Number.isInteger(p) && p >= 1 && p <= 99;
    const daftar = valid ? [{ label: `P${p}`, pembagi: 100, i: p }] : [];

    isiBagianUkuranLetak(tabel, "tabelKelasPersentil", "totalFPersentil", "tabelHasilPersentil", daftar, "Masukkan persentil berupa bilangan bulat 1–99.");
}

function tampilkanUkuranLetak(tabel) {
    const kuartil = [1, 2, 3].map((i) => ({ label: `Q${i}`, pembagi: 4, i }));
    const desil = Array.from({ length: 9 }, (_, j) => ({ label: `D${j + 1}`, pembagi: 10, i: j + 1 }));

    isiBagianUkuranLetak(tabel, "tabelKelasKuartil", "totalFKuartil", "tabelHasilKuartil", kuartil, "");
    isiBagianUkuranLetak(tabel, "tabelKelasDesil", "totalFDesil", "tabelHasilDesil", desil, "");
    tampilkanPersentilBerkelompok(tabel);
}

// Penanganan Event
formMahasiswa.addEventListener("submit", (e) => {
    e.preventDefault();

    const npm = inputNpm.value.trim();
    const nilai = parseFloat(inputNilai.value);

    if (!npm) {
        tampilkanPesan("NPM tidak boleh kosong.");
        return;
    }
    if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
        tampilkanPesan("Nilai harus berupa angka antara 0 dan 100.");
        return;
    }

    daftarMahasiswa.push({ id: idBerikutnya++, npm, nilai });
    formMahasiswa.reset();
    inputNpm.focus();
    tampilkanPesan(`Data NPM "${npm}" berhasil ditambahkan.`, false);
    segarkan();
});

badanTabel.addEventListener("click", (e) => {
    const tombol = e.target.closest(".tombol-hapus");
    if (!tombol) return;

    const id = Number(tombol.dataset.id);
    daftarMahasiswa = daftarMahasiswa.filter((m) => m.id !== id);
    tampilkanPesan("Data berhasil dihapus.", false);
    segarkan();
});

tombolContoh.addEventListener("click", () => {
    const contoh = [
        ["253040001", 92], ["253040002", 85], ["253040003", 76], ["253040004", 6], ["253040005", 72],
        ["253040006", 88], ["253040007", 95], ["253040008", 66], ["253040009", 74], ["253040010", 8],
        ["253040011", 78], ["253040012", 64], ["253040013", 9], ["253040014", 85], ["253040015", 56],
        ["253040016", 48], ["253040017", 7], ["253040018", 62], ["253040019", 58], ["253040020", 54],
        ["253040021", 68], ["253040022", 5], ["253040023", 84], ["253040024", 66], ["253040025", 88],
        ["253040026", 92], ["253040027", 96], ["253040028", 72], ["253040029", 6], ["253040030", 74],
        ["253040031", 8], ["253040032", 76], ["253040033", 4], ["253040034", 32], ["253040035", 86],
        ["253040036", 94], ["253040037", 9], ["253040038", 78], ["253040039", 64], ["253040040", 82],
        ["253040041", 6], ["253040042", 52], ["253040043", 7], ["253040044", 68], ["253040045", 58],
        ["253040046", 88], ["253040047", 72], ["253040048", 76], ["253040049", 66], ["253040050", 74],
    ];

    daftarMahasiswa = contoh.map(([npm, nilai]) => ({ id: idBerikutnya++, npm, nilai }));
    tampilkanPesan("Data contoh berhasil dimuat.", false);
    segarkan();
});

tombolReset.addEventListener("click", () => {
    if (daftarMahasiswa.length === 0) {
        tampilkanPesan("Tidak ada data untuk direset.");
        return;
    }
    if (!confirm("Hapus semua data mahasiswa?")) return;

    daftarMahasiswa = [];
    idBerikutnya = 1;
    tampilkanPesan("Semua data telah direset.", false);
    segarkan();
});

inputJumlahKelas.addEventListener("input", tampilkanDistribusi);
document.querySelectorAll('input[name="modeKelas"]').forEach((r) => r.addEventListener("change", tampilkanDistribusi));
inputPersentilBerkelompok.addEventListener("input", () => {
    if (tabelTerakhir) tampilkanPersentilBerkelompok(tabelTerakhir);
});
tombolPersentil.addEventListener("click", perbaruiPersentil);
inputPersentil.addEventListener("keydown", (e) => {
    if (e.key === "Enter") perbaruiPersentil();
});

// Inisialisasi
segarkan();