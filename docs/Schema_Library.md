# Schema Database - Quản Lý Thư Viện

```sql
CREATE DATABASE QuanLyThuVien
GO

USE QuanLyThuVien
GO
```

---

## Bảng `DocGia`

```sql
CREATE TABLE DocGia(
    MaDocGia INT PRIMARY KEY IDENTITY(100001, 1),
    MatKhau VARCHAR(100) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    GioiTinh NVARCHAR(10),
    Email VARCHAR(100) UNIQUE,
    SoDienThoai VARCHAR(15) UNIQUE,
    NgayCapThe DATE NOT NULL DEFAULT GETDATE(),
    NgayHetHan DATE NOT NULL,
    TongNo DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT check_tongno CHECK (TongNo >= 0),
    TrangThaiThe NVARCHAR(20) NOT NULL DEFAULT N'Hoat Dong',
    CONSTRAINT check_trangthaithe CHECK (
        TrangThaiThe IN (N'Hoat Dong', N'HetHan', N'Bi khoa')
    )
);
```

---

## Bảng `NhanVien`

```sql
CREATE TABLE NhanVien (
    MaNhanVien INT PRIMARY KEY IDENTITY(1,1),
    MatKhau VARCHAR(255) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    ChucVu VARCHAR(20) NOT NULL
        CHECK (ChucVu IN ('NhanVien', 'QuanLy'))
);
```

---

## Bảng `NXB`

```sql
CREATE TABLE NXB (
    MaSoNXB INT PRIMARY KEY IDENTITY(1,1),
    TenNXB NVARCHAR(200) NOT NULL,
    SoDienThoai VARCHAR(15),
    Email VARCHAR(100),
    DiaChi NVARCHAR(255)
);
```

---

## Bảng `TacGia`

```sql
CREATE TABLE TacGia (
    MaSoTG INT PRIMARY KEY IDENTITY(1,1),
    TenTacGia NVARCHAR(100) NOT NULL,
    QuocTich NVARCHAR(50),
    NgaySinh DATE,
    MoTa NVARCHAR(MAX)
);
```

---

## Bảng `TheLoai`

```sql
CREATE TABLE TheLoai (
    MaTheLoai INT PRIMARY KEY IDENTITY(1,1),
    TenTheLoai NVARCHAR(100) NOT NULL
);
```

---

## Bảng `DauSach`

```sql
CREATE TABLE DauSach (
    ISBN VARCHAR(20) PRIMARY KEY,
    MaSoNXB INT FOREIGN KEY REFERENCES NXB(MaSoNXB),
    TenSach NVARCHAR(255) NOT NULL,
    NamXuatBan INT NOT NULL,
    SoTrang INT,
    MoTa NVARCHAR(1000),
    GiaBia DECIMAL(10,2) NOT NULL,
    CONSTRAINT check_giabia CHECK (GiaBia > 0)
);
```

---

## Bảng `TacGia_DauSach`

```sql
CREATE TABLE TacGia_DauSach (
    MaSoTG INT NOT NULL FOREIGN KEY REFERENCES TacGia(MaSoTG),
    ISBN VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES DauSach(ISBN),
    PRIMARY KEY (MaSoTG, ISBN)
);
```

---

## Bảng `TheLoai_DauSach`

```sql
CREATE TABLE TheLoai_DauSach (
    ISBN VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES DauSach(ISBN),
    MaTheLoai INT NOT NULL FOREIGN KEY REFERENCES TheLoai(MaTheLoai),
    PRIMARY KEY (ISBN, MaTheLoai)
);
```

---

## Bảng `CuonSach`

```sql
CREATE TABLE CuonSach (
    MaSach INT PRIMARY KEY IDENTITY(1,1),
    ISBN VARCHAR(20) NOT NULL REFERENCES DauSach(ISBN),
    TinhTrang NVARCHAR(20) NOT NULL DEFAULT N'Tot'
        CHECK (
            TinhTrang IN (
                N'Tot',
                N'HongNhe',
                N'HongNang',
                N'Mat',
                N'DangMuon'
            )
        ),
    HeSoDenBu DECIMAL(4,2) NOT NULL DEFAULT 1.2,
    CONSTRAINT check_hesodenbu CHECK (HeSoDenBu >= 1)
);
```

---

## Bảng `ThongBao`

```sql
CREATE TABLE ThongBao (
    MaThongBao INT PRIMARY KEY IDENTITY(1,1),
    MaDocGia INT NOT NULL FOREIGN KEY REFERENCES DocGia(MaDocGia),
    NgayGui DATETIME NOT NULL DEFAULT GETDATE(),
    NoiDung NVARCHAR(500) NOT NULL,
    DaDoc BIT NOT NULL DEFAULT 0,
    LoaiThongBao NVARCHAR(50) NOT NULL
        CHECK (
            LoaiThongBao IN (
                N'NhacMuonSach',
                N'NhacTraSach',
                N'HuyPhieu',
                N'KhoaThe',
                N'MoThe',
                N'TienPhat'
            )
        )
);
```

---

## Bảng `PhieuMuon`

```sql
CREATE TABLE PhieuMuon (
    MaPhieuMuon INT PRIMARY KEY IDENTITY(1,1),
    MaDocGia INT NOT NULL FOREIGN KEY REFERENCES DocGia(MaDocGia),
    MaNhanVien INT FOREIGN KEY REFERENCES NhanVien(MaNhanVien),
    NgayTaoPhieu DATETIME NOT NULL DEFAULT GETDATE(),
    NgayHetHanGiuSach DATETIME NOT NULL,
    NgayMuon DATETIME,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'ChoLaySach'
        CHECK (
            TrangThai IN (
                N'ChoLaySach',
                N'DangMuon',
                N'DaHuy',
                N'HoanThanh'
            )
        )
);
```

---

## Bảng `ChiTietPhieuMuon`

```sql
CREATE TABLE ChiTietPhieuMuon (
    MaPhieuMuon INT NOT NULL
        FOREIGN KEY REFERENCES PhieuMuon(MaPhieuMuon),

    MaSach INT NOT NULL
        FOREIGN KEY REFERENCES CuonSach(MaSach),

    HanTra DATE NOT NULL,
    NgayTra DATE,

    TinhTrangTra NVARCHAR(50)
        CHECK (
            TinhTrangTra IN (
                N'BinhThuong',
                N'HongNhe',
                N'HongNang',
                N'Mat'
            )
        ),

    TienPhat DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT check_tienphat CHECK (TienPhat >= 0),

    PRIMARY KEY (MaPhieuMuon, MaSach)
);
```

---

## Bảng `PhieuThuTien`

```sql
CREATE TABLE PhieuThuTien (
    MaPhieuThu INT PRIMARY KEY IDENTITY(1,1),

    MaNhanVien INT NOT NULL
        FOREIGN KEY REFERENCES NhanVien(MaNhanVien),

    MaPhieuMuon INT NOT NULL
        FOREIGN KEY REFERENCES PhieuMuon(MaPhieuMuon),

    SoTienThu DECIMAL(10,2) NOT NULL
        CHECK (SoTienThu > 0),

    LyDoThu NVARCHAR(100) NOT NULL,

    NgayThu DATETIME NOT NULL DEFAULT GETDATE()
);
```

---

# Indexes

## Tìm kiếm theo tên sách

```sql
CREATE INDEX IDX_DauSach_TenSach
ON DauSach(TenSach);
```

## Tìm kiếm theo tên tác giả

```sql
CREATE INDEX IDX_TacGia_Ten
ON TacGia(TenTacGia);
```

## Đăng nhập bằng Email

```sql
CREATE INDEX IDX_DocGia_Email
ON DocGia(Email);
```

## Đăng nhập bằng SĐT

```sql
CREATE INDEX IDX_DocGia_SDT
ON DocGia(SoDienThoai);
```

## Xem lịch sử mượn sách của độc giả

```sql
CREATE INDEX IDX_PhieuMuon_MaDG
ON PhieuMuon(MaDocGia);
```
