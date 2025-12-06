// نظام الحضور والغياب - JavaScript

// تهيئة البيانات
let data = JSON.parse(localStorage.getItem('attendanceData')) || {
    classes: [],
    students: {},
    records: []
};

// حفظ البيانات
function saveData() {
    localStorage.setItem('attendanceData', JSON.stringify(data));
}

// تحديث قوائم الفصول
function updateClassSelects() {
    const selects = ['classSelect', 'classForStudent', 'classToManage', 'reportClass', 'monthlyReportClass'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        const firstOption = select.options[0].outerHTML;
        const extraOptions = id === 'reportClass' ? '<option value="all">جميع الفصول</option>' : '';
        select.innerHTML = firstOption + extraOptions + data.classes.map(c => 
            `<option value="${c}">${c}</option>`
        ).join('');
        if (data.classes.includes(currentValue) || (id === 'reportClass' && currentValue === 'all')) {
            select.value = currentValue;
        }
    });
}

// إضافة فصل
function addClass() {
    const name = document.getElementById('newClassName').value.trim();
    if (!name) return alert('الرجاء إدخال اسم الفصل');
    if (data.classes.includes(name)) return alert('هذا الفصل موجود مسبقاً');
    
    data.classes.push(name);
    data.students[name] = [];
    saveData();
    updateClassSelects();
    document.getElementById('newClassName').value = '';
    alert('تم إضافة الفصل بنجاح');
}

// حذف فصل
function deleteClass() {
    const className = document.getElementById('classToManage').value;
    if (!className) return alert('الرجاء اختيار فصل');
    if (!confirm(`هل أنت متأكد من حذف فصل "${className}"؟`)) return;
    
    data.classes = data.classes.filter(c => c !== className);
    delete data.students[className];
    data.records = data.records.filter(r => r.class !== className);
    saveData();
    updateClassSelects();
    document.getElementById('manageList').innerHTML = '';
    alert('تم حذف الفصل');
}

// إضافة طالب
function addStudent() {
    const className = document.getElementById('classForStudent').value;
    const name = document.getElementById('newStudentName').value.trim();
    
    if (!className) return alert('الرجاء اختيار الفصل');
    if (!name) return alert('الرجاء إدخال اسم الطالب');
    if (data.students[className].includes(name)) return alert('هذا الطالب موجود مسبقاً');
    
    data.students[className].push(name);
    saveData();
    document.getElementById('newStudentName').value = '';
    alert('تم إضافة الطالب بنجاح');
}

// حذف طالب
function deleteStudent(className, studentName) {
    if (!confirm(`هل أنت متأكد من حذف "${studentName}"؟`)) return;
    
    data.students[className] = data.students[className].filter(s => s !== studentName);
    data.records = data.records.filter(r => !(r.class === className && r.student === studentName));
    saveData();
    loadStudentsToManage();
}

// تحميل طلاب للإدارة
function loadStudentsToManage() {
    const className = document.getElementById('classToManage').value;
    const container = document.getElementById('manageList');
    
    if (!className) {
        container.innerHTML = '';
        return;
    }
    
    const students = data.students[className] || [];
    container.innerHTML = students.map(s => `
        <div class="student-item">
            <span class="student-name">${s}</span>
            <button class="btn-danger" onclick="deleteStudent('${className}', '${s}')" style="width:auto;padding:8px 15px;">حذف</button>
        </div>
    `).join('') || '<p>لا يوجد طلاب في هذا الفصل</p>';
}

// تحميل طلاب للحضور
function loadStudents() {
    const className = document.getElementById('classSelect').value;
    const period = document.getElementById('periodSelect').value;
    const section = document.getElementById('studentsSection');
    const container = document.getElementById('studentsList');
    
    if (!className) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG');
    document.getElementById('currentPeriod').textContent = document.getElementById('periodSelect').selectedOptions[0].text;
    
    const students = data.students[className] || [];
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = students.map(student => {
        const record = data.records.find(r => 
            r.class === className && r.student === student && r.date === today && r.period === period
        );
        const statusClass = record ? (record.status === 'حاضر' ? 'status-present' : 'status-absent') : '';
        
        return `
            <div class="student-item ${statusClass}" id="student-${student.replace(/\s/g, '-')}">
                <span class="student-name">${student}</span>
                <div class="attendance-btns">
                    <button class="btn-success" onclick="markAttendance('${className}', '${student}', 'حاضر')">✓ حاضر</button>
                    <button class="btn-danger" onclick="markAttendance('${className}', '${student}', 'غائب')">✗ غائب</button>
                </div>
            </div>
        `;
    }).join('') || '<p>لا يوجد طلاب في هذا الفصل. أضف طلاباً من قسم "إدارة الفصول"</p>';
}

// تسجيل الكل حاضرين
function markAllPresent() {
    const className = document.getElementById('classSelect').value;
    const period = document.getElementById('periodSelect').value;
    if (!className) return;
    
    const students = data.students[className] || [];
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    students.forEach(student => {
        // حذف السجل القديم لنفس اليوم والحصة إن وجد
        data.records = data.records.filter(r => 
            !(r.class === className && r.student === student && r.date === date && r.period === period)
        );
        
        // إضافة سجل حاضر
        data.records.push({
            class: className,
            student: student,
            date: date,
            time: time,
            period: period,
            status: 'حاضر'
        });
    });
    
    saveData();
    loadStudents();
}

// تسجيل الحضور
function markAttendance(className, student, status) {
    const period = document.getElementById('periodSelect').value;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    // حذف السجل القديم لنفس اليوم والحصة إن وجد
    data.records = data.records.filter(r => 
        !(r.class === className && r.student === student && r.date === date && r.period === period)
    );
    
    // إضافة السجل الجديد
    data.records.push({
        class: className,
        student: student,
        date: date,
        time: time,
        period: period,
        status: status
    });
    
    saveData();
    loadStudents();
}

// تحميل التقرير
function loadReport() {
    const className = document.getElementById('reportClass').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const container = document.getElementById('reportTable');
    
    let records = [...data.records];
    
    if (className && className !== 'all') {
        records = records.filter(r => r.class === className);
    }
    if (dateFrom) {
        records = records.filter(r => r.date >= dateFrom);
    }
    if (dateTo) {
        records = records.filter(r => r.date <= dateTo);
    }
    
    if (records.length === 0) {
        container.innerHTML = '<p>لا توجد سجلات</p>';
        return;
    }
    
    // تجميع البيانات حسب الفصل والطالب والتاريخ
    const grouped = {};
    records.forEach(r => {
        const key = `${r.class}|${r.student}|${r.date}`;
        if (!grouped[key]) {
            grouped[key] = {
                class: r.class,
                student: r.student,
                date: r.date,
                periods: {}
            };
        }
        grouped[key].periods[r.period] = r.status;
    });
    
    const rows = Object.values(grouped);
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.student.localeCompare(b.student));
    
    const getStatusCell = (status) => {
        if (!status) return '<td>-</td>';
        const color = status === 'حاضر' ? 'green' : 'red';
        const symbol = status === 'حاضر' ? '✓' : '✗';
        return `<td style="color:${color};font-weight:bold;">${symbol}</td>`;
    };
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>الفصل</th>
                    <th>الطالب</th>
                    <th>التاريخ</th>
                    <th>ح1</th>
                    <th>ح2</th>
                    <th>ح3</th>
                    <th>ح4</th>
                    <th>ح5</th>
                    <th>ح6</th>
                    <th>ح7</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => `
                    <tr>
                        <td>${r.class}</td>
                        <td>${r.student}</td>
                        <td>${r.date}</td>
                        ${getStatusCell(r.periods['1'])}
                        ${getStatusCell(r.periods['2'])}
                        ${getStatusCell(r.periods['3'])}
                        ${getStatusCell(r.periods['4'])}
                        ${getStatusCell(r.periods['5'])}
                        ${getStatusCell(r.periods['6'])}
                        ${getStatusCell(r.periods['7'])}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// تصدير إلى Excel
function exportToExcel() {
    const className = document.getElementById('reportClass').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    
    let records = [...data.records];
    
    if (className && className !== 'all') {
        records = records.filter(r => r.class === className);
    }
    if (dateFrom) {
        records = records.filter(r => r.date >= dateFrom);
    }
    if (dateTo) {
        records = records.filter(r => r.date <= dateTo);
    }
    
    if (records.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }
    
    // تجميع البيانات حسب الفصل والطالب والتاريخ
    const grouped = {};
    records.forEach(r => {
        const key = `${r.class}|${r.student}|${r.date}`;
        if (!grouped[key]) {
            grouped[key] = {
                class: r.class,
                student: r.student,
                date: r.date,
                periods: {}
            };
        }
        grouped[key].periods[r.period] = r.status;
    });
    
    const rows = Object.values(grouped);
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.student.localeCompare(b.student));
    
    // إنشاء ملف Excel
    const headers = ['الفصل', 'اسم الطالب', 'التاريخ', 'ح1', 'ح2', 'ح3', 'ح4', 'ح5', 'ح6', 'ح7'];
    const excelRows = rows.map(r => [
        r.class, 
        r.student, 
        r.date,
        r.periods['1'] || '-',
        r.periods['2'] || '-',
        r.periods['3'] || '-',
        r.periods['4'] || '-',
        r.periods['5'] || '-',
        r.periods['6'] || '-',
        r.periods['7'] || '-'
    ]);
    
    const wsData = [headers, ...excelRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الحضور');
    
    // تحميل الملف
    XLSX.writeFile(wb, `سجل_الحضور_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// التبديل بين التبويبات
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// استيراد من Excel
function importFromExcel(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // تخطي الصف الأول (العناوين)
            let imported = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length < 2) continue;
                
                const studentName = String(row[0]).trim();
                const className = String(row[1]).trim();
                
                if (!studentName || !className) continue;
                
                // إضافة الفصل إذا لم يكن موجوداً
                if (!data.classes.includes(className)) {
                    data.classes.push(className);
                    data.students[className] = [];
                }
                
                // إضافة الطالب إذا لم يكن موجوداً
                if (!data.students[className].includes(studentName)) {
                    data.students[className].push(studentName);
                    imported++;
                }
            }
            
            saveData();
            updateClassSelects();
            input.value = '';
            alert(`تم استيراد ${imported} طالب بنجاح!`);
            
        } catch (err) {
            alert('حدث خطأ في قراءة الملف. تأكد من صحة التنسيق.');
            console.error(err);
        }
    };
    reader.readAsBinaryString(file);
}

// التقرير الشهري التجميعي
function loadMonthlyReport() {
    const className = document.getElementById('monthlyReportClass').value;
    const month = document.getElementById('reportMonth').value;
    const container = document.getElementById('monthlyReportTable');
    
    if (!className || !month) {
        container.innerHTML = '<p>الرجاء اختيار الفصل والشهر</p>';
        return;
    }
    
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-31`;
    
    const students = data.students[className] || [];
    const absenceData = [];
    
    students.forEach(student => {
        const absences = data.records.filter(r => 
            r.class === className && 
            r.student === student && 
            r.status === 'غائب' &&
            r.date >= startDate && 
            r.date <= endDate
        );
        
        const absenceDates = absences.map(a => `${a.date} (ح${a.period || '?'})`).join(' ، ');
        absenceData.push({
            student: student,
            count: absences.length,
            dates: absenceDates
        });
    });
    
    // ترتيب حسب عدد الغياب تنازلياً
    absenceData.sort((a, b) => b.count - a.count);
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>اسم الطالب</th>
                    <th>عدد أيام الغياب</th>
                    <th>تواريخ الغياب</th>
                </tr>
            </thead>
            <tbody>
                ${absenceData.map(s => `
                    <tr style="${s.count > 0 ? 'background:#fff3cd;' : ''}">
                        <td>${s.student}</td>
                        <td style="color: ${s.count > 0 ? 'red' : 'green'}; font-weight:bold;">${s.count}</td>
                        <td style="font-size:12px;">${s.dates || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top:10px;color:#666;">إجمالي الطلاب: ${students.length} | الطلاب الغائبين: ${absenceData.filter(s => s.count > 0).length}</p>
    `;
}

// تصدير التقرير الشهري
function exportMonthlyReport() {
    const className = document.getElementById('monthlyReportClass').value;
    const month = document.getElementById('reportMonth').value;
    
    if (!className || !month) {
        alert('الرجاء اختيار الفصل والشهر');
        return;
    }
    
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-31`;
    
    const students = data.students[className] || [];
    const rows = [];
    
    students.forEach(student => {
        const absences = data.records.filter(r => 
            r.class === className && 
            r.student === student && 
            r.status === 'غائب' &&
            r.date >= startDate && 
            r.date <= endDate
        );
        
        rows.push([student, absences.length, absences.map(a => `${a.date} (ح${a.period || '?'})`).join(' ، ')]);
    });
    
    const headers = ['اسم الطالب', 'عدد أيام الغياب', 'تواريخ الغياب'];
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير الشهري');
    
    XLSX.writeFile(wb, `تقرير_الغياب_${className}_${month}.xlsx`);
}

// تحديث السجلات القديمة لإضافة رقم الحصة
function migrateOldRecords() {
    let updated = false;
    data.records.forEach(record => {
        if (!record.period) {
            record.period = '1';
            updated = true;
        }
    });
    if (updated) {
        saveData();
    }
}

// تصدير نسخة احتياطية
function exportBackup() {
    const backupData = {
        version: 1,
        exportDate: new Date().toISOString(),
        data: data
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// استيراد نسخة احتياطية
function importBackup(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.data || !backup.data.classes) {
                throw new Error('ملف غير صالح');
            }
            
            if (!confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
                input.value = '';
                return;
            }
            
            data = backup.data;
            saveData();
            updateClassSelects();
            input.value = '';
            alert('تم استيراد البيانات بنجاح!');
            
        } catch (err) {
            alert('حدث خطأ في قراءة الملف. تأكد من أنه ملف نسخة احتياطية صحيح.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// تهيئة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // تحديث السجلات القديمة
    migrateOldRecords();
    
    updateClassSelects();
    
    // تعيين تاريخ اليوم كافتراضي
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDateFrom').value = today;
    document.getElementById('reportDateTo').value = today;
    
    // تعيين الشهر الحالي
    document.getElementById('reportMonth').value = today.substring(0, 7);
});
