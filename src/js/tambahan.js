// Fitur tambahan: impor Excel/CSV (SheetJS) dan grafik histogram, poligon, ogive (Chart.js)


const idEl = (id) => document.getElementById(id);

// Impor Excel / CSV
idEl("fileExcel").addEventListener("change", async (e) => {
    const berkas = e.target.files[0];
    if (!berkas) return;

    if (typeof XLSX === "undefined") {
        tampilkanPesan("Library SheetJS gagal dimuat. Periksa koneksi internet.");
        e.target.value = "";
        return;
    }

    try {
        const buffer = await berkas.arrayBuffer();
        const buku = XLSX.read(buffer, { type: "array" });
        const lembar = buku.Sheets[buku.SheetNames[0]];
        const baris = XLSX.utils.sheet_to_json(lembar, { header: 1, defval: "" });

        const hasil = [];
        let dilewati = 0;

        baris.forEach((r, i) => {
            const isi = r.filter((c) => String(c).trim() !== "");
            if (isi.length === 0) return;

            // 1 kolom = nilai saja; 2 kolom atau lebih = NPM, Nilai
            const mentah = isi.length === 1 ? isi[0] : isi[1];
            const nilai = typeof mentah === "number" ? mentah : parseFloat(String(mentah).replace(",", "."));

            if (Number.isNaN(nilai)) {
                if (i !== 0) dilewati++; // baris pertama dianggap judul kolom
                return;
            }
            if (nilai < 0 || nilai > 100) {
                dilewati++;
                return;
            }

            const npm = isi.length === 1 ? `Data ${hasil.length + 1}` : String(isi[0]).trim();
            hasil.push({ npm, nilai });
        });

        if (hasil.length === 0) {
            tampilkanPesan("Tidak ada nilai valid (0–100) yang ditemukan pada file.");
            return;
        }

        daftarMahasiswa = hasil.map((m) => ({ id: idBerikutnya++, ...m }));
        let pesan = `${hasil.length} data dari "${berkas.name}" berhasil diimpor.`;
        if (dilewati > 0) pesan += ` ${dilewati} baris dilewati karena tidak valid.`;
        tampilkanPesan(pesan, false);
        segarkan();
    } catch (err) {
        console.error(err);
        tampilkanPesan("File tidak dapat dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.");
    } finally {
        e.target.value = ""; // supaya file yang sama bisa diunggah ulang
    }
});

// Grafik (Chart.js)
let grafikHistogramObj = null;
let grafikOgiveObj = null;

function siapkanWadah(idWadah, grafikLama) {
    if (grafikLama) grafikLama.destroy();
    const wadah = idEl(idWadah);
    wadah.innerHTML = `<div style="position:relative;height:380px;min-width:560px"><canvas></canvas></div>`;
    return wadah.querySelector("canvas");
}

function aturGayaChart() {
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "#1e293b";
    Chart.defaults.font.family = "inherit";
}

function opsiDasar(judulX, judulY) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
            x: { title: { display: true, text: judulX, color: "#cbd5e1" }, grid: { color: "#1e293b" } },
            y: {
                beginAtZero: true,
                title: { display: true, text: judulY, color: "#cbd5e1" },
                grid: { color: "#1e293b" },
                ticks: { precision: 0 },
            },
        },
    };
}

function gambarHistogram(tabel) {
    const { kelas, lebar: w, desimal: d } = tabel;
    const awal = kelas[0];
    const akhir = kelas[kelas.length - 1];
    const label = (a, b) => `${formatAngka(a, d)}–${formatAngka(b, d)}`;

    // Satu kelas kosong di kiri dan kanan supaya poligon tertutup di sumbu-x
    const labels = [
        label(awal.batasBawah - w, awal.batasAtas - w),
        ...kelas.map((k) => label(k.batasBawah, k.batasAtas)),
        label(akhir.batasBawah + w, akhir.batasAtas + w),
    ];
    const data = [0, ...kelas.map((k) => k.frek), 0];

    const kanvas = siapkanWadah("grafikHistogram", grafikHistogramObj);
    const opsi = opsiDasar("Kelas (LCL–UCL)", "Frekuensi");
    opsi.scales.y.suggestedMax = Math.max(...data) + 1;

    grafikHistogramObj = new Chart(kanvas, {
        data: {
            labels,
            datasets: [
                {
                    type: "bar",
                    label: "Histogram",
                    data,
                    backgroundColor: "rgba(59,130,246,0.55)",
                    borderColor: "#60a5fa",
                    borderWidth: 1,
                    barPercentage: 1,
                    categoryPercentage: 1,
                    order: 2,
                },
                {
                    type: "line",
                    label: "Poligon frekuensi",
                    data,
                    borderColor: "#f59e0b",
                    backgroundColor: "#f59e0b",
                    borderWidth: 2.5,
                    tension: 0,
                    pointRadius: 4,
                    order: 1,
                },
            ],
        },
        options: opsi,
    });
}

function gambarOgive(tabel) {
    const { kelas, desimal: d, n } = tabel;
    const awal = kelas[0];
    const akhir = kelas[kelas.length - 1];

    const kurangDari = [{ x: awal.tepiBawah, y: 0 }, ...kelas.map((k) => ({ x: k.tepiAtas, y: k.kurangDari }))];
    const lebihDari = [...kelas.map((k) => ({ x: k.tepiBawah, y: k.lebihDari })), { x: akhir.tepiAtas, y: 0 }];
    const batas = [...kelas.map((k) => k.tepiBawah), akhir.tepiAtas];

    const kanvas = siapkanWadah("grafikOgive", grafikOgiveObj);
    const opsi = opsiDasar("Tepi kelas (nilai)", "Frekuensi kumulatif");
    opsi.scales.x = {
        ...opsi.scales.x,
        type: "linear",
        min: awal.tepiBawah,
        max: akhir.tepiAtas,
        afterBuildTicks: (sumbu) => {
            sumbu.ticks = batas.map((v) => ({ value: v }));
        },
        ticks: { callback: (v) => formatAngka(v, d + 1), maxRotation: 60 },
    };
    opsi.scales.y.max = n;

    grafikOgiveObj = new Chart(kanvas, {
        type: "line",
        data: {
            datasets: [
                {
                    label: "Ogive kurang dari",
                    data: kurangDari,
                    borderColor: "#10b981",
                    backgroundColor: "#10b981",
                    borderWidth: 2.5,
                    tension: 0,
                    pointRadius: 4,
                },
                {
                    label: "Ogive lebih dari",
                    data: lebihDari,
                    borderColor: "#a855f7",
                    backgroundColor: "#a855f7",
                    borderWidth: 2.5,
                    tension: 0,
                    pointRadius: 4,
                },
                {
                    label: `n/2 = ${formatAngka(n / 2, 1)}`,
                    data: [
                        { x: awal.tepiBawah, y: n / 2 },
                        { x: akhir.tepiAtas, y: n / 2 },
                    ],
                    borderColor: "#94a3b8",
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    pointRadius: 0,
                },
            ],
        },
        options: opsi,
    });
}

function kosongkanGrafik() {
    if (grafikHistogramObj) grafikHistogramObj.destroy();
    if (grafikOgiveObj) grafikOgiveObj.destroy();
    grafikHistogramObj = null;
    grafikOgiveObj = null;

    const pesan = `<p class="px-4 py-10 text-center text-sm text-slate-500">Belum ada tabel distribusi frekuensi.</p>`;
    idEl("grafikHistogram").innerHTML = pesan;
    idEl("grafikOgive").innerHTML = pesan;
}

function gambarGrafik(tabel) {
    if (typeof Chart === "undefined") {
        const galat = `<p class="px-4 py-10 text-center text-sm text-amber-400">Library Chart.js gagal dimuat. Periksa koneksi internet.</p>`;
        idEl("grafikHistogram").innerHTML = galat;
        idEl("grafikOgive").innerHTML = galat;
        return;
    }
    aturGayaChart();
    gambarHistogram(tabel);
    gambarOgive(tabel);
}