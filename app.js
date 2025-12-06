// نظام الحضور والغياب - JavaScript

// البحث السريع عن طالب
function searchStudent() {
    const query = document.getElementById('searchStudent').value.trim().toLowerCase();
    const container = document.getElementById('searchResults');
    
    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }
    
    const results = [];
    data.classes.forEach(className => {
        const students = data.students[className] || [];
        students.forEach(student => {
            if (student.toLowerCase().includes(query)) {
                // حساب الغياب هذا الشهر
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const startDate = `${year}-${month}-01`;
                const endDate = `${year}-${month}-31`;
                
                const absences = data.records.filter(r => 
                    r.class === className && r.student === student && 
                    r.status === 'غائب' && r.date >= startDate && r.date <= endDate
                ).length;
                
                results.push({ student, className, absences });
            }
        });
    });
    
    if (results.length === 0) {
        container.innerHTML = '<p style="color:#666;">لا توجد نتائج</p>';
        return;
    }
    
    container.innerHTML = results.slice(0, 5).map(r => `
        <div class="student-item" style="margin-bottom:8px;">
            <div>
                <span class="student-name">${r.student}</span>
                <span style="color:#666;font-size:12px;display:block;">${r.className}</span>
            </div>
            <span style="background:${r.absences > 0 ? '#dc3545' : '#28a745'};color:white;padding:5px 10px;border-radius:15px;font-size:12px;">
                ${r.absences} غياب هذا الشهر
            </span>
        </div>
    `).join('');
}

// الوضع المظلم
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeBtn').textContent = isDark ? '☀️' : '🌙';
}

function loadDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeBtn').textContent = '☀️';
    }
}

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
    const selects = ['classSelect', 'classForStudent', 'classToManage', 'reportClass', 'monthlyReportClass', 'alertsClass', 'statsClass', 'editClass'];
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
        let statusClass = '';
        if (record) {
            if (record.status === 'حاضر') statusClass = 'status-present';
            else if (record.status === 'متأخر') statusClass = 'status-late';
            else if (record.status === 'غائب بعذر') statusClass = 'status-excused';
            else statusClass = 'status-absent';
        }
        
        return `
            <div class="student-item ${statusClass}" id="student-${student.replace(/\s/g, '-')}">
                <span class="student-name">${student}</span>
                <div class="attendance-btns">
                    <button class="btn-success" onclick="markAttendance('${className}', '${student}', 'حاضر')">✓ حاضر</button>
                    <button class="btn-danger" onclick="markAttendance('${className}', '${student}', 'غائب')">✗ غائب</button>
                    <button class="btn-warning" onclick="markAttendance('${className}', '${student}', 'غائب بعذر')" style="font-size:12px;">📋 بعذر</button>
                    <button class="btn-secondary" onclick="markAttendance('${className}', '${student}', 'متأخر')" style="font-size:12px;">⏰ متأخر</button>
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
        let color = 'gray', symbol = '-';
        if (status === 'حاضر') { color = 'green'; symbol = '✓'; }
        else if (status === 'غائب') { color = 'red'; symbol = '✗'; }
        else if (status === 'غائب بعذر') { color = '#6c757d'; symbol = '📋'; }
        else if (status === 'متأخر') { color = '#ffc107'; symbol = '⏰'; }
        return `<td style="color:${color};font-weight:bold;" title="${status}">${symbol}</td>`;
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

// تحميل طلاب للتعديل
function loadEditStudents() {
    const className = document.getElementById('editClass').value;
    const studentSelect = document.getElementById('editStudent');
    
    studentSelect.innerHTML = '<option value="">-- اختر الطالب --</option>';
    document.getElementById('editRecordStatus').innerHTML = '';
    
    if (!className) return;
    
    const students = data.students[className] || [];
    students.forEach(s => {
        studentSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

// تحميل سجل للتعديل
function loadEditRecord() {
    const className = document.getElementById('editClass').value;
    const student = document.getElementById('editStudent').value;
    const date = document.getElementById('editDate').value;
    const period = document.getElementById('editPeriod').value;
    const container = document.getElementById('editRecordStatus');
    
    if (!className || !student || !date) {
        container.innerHTML = '';
        return;
    }
    
    const record = data.records.find(r => 
        r.class === className && r.student === student && r.date === date && r.period === period
    );
    
    const currentStatus = record ? record.status : 'لا يوجد سجل';
    const statusColor = record ? (record.status === 'حاضر' ? 'green' : 'red') : '#666';
    
    container.innerHTML = `
        <div style="padding:15px;background:#f8f9fa;border-radius:10px;margin-bottom:10px;">
            <strong>الحالة الحالية:</strong> 
            <span style="color:${statusColor};font-weight:bold;">${currentStatus}</span>
        </div>
        <div style="display:flex;gap:10px;">
            <button class="btn-success" onclick="updateRecord('${className}', '${student}', '${date}', '${period}', 'حاضر')">✓ تعديل إلى حاضر</button>
            <button class="btn-danger" onclick="updateRecord('${className}', '${student}', '${date}', '${period}', 'غائب')">✗ تعديل إلى غائب</button>
        </div>
    `;
}

// تحديث سجل
function updateRecord(className, student, date, period, status) {
    // حذف السجل القديم إن وجد
    data.records = data.records.filter(r => 
        !(r.class === className && r.student === student && r.date === date && r.period === period)
    );
    
    // إضافة السجل الجديد
    data.records.push({
        class: className,
        student: student,
        date: date,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        period: period,
        status: status
    });
    
    saveData();
    loadEditRecord();
    alert('تم تحديث السجل بنجاح');
}

// تحميل الإحصائيات
function loadStats() {
    const className = document.getElementById('statsClass').value;
    const container = document.getElementById('statsContainer');
    
    if (!className) {
        container.innerHTML = '';
        return;
    }
    
    const students = data.students[className] || [];
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    
    // سجلات الشهر الحالي
    const monthRecords = data.records.filter(r => 
        r.class === className && r.date >= startDate && r.date <= endDate
    );
    
    const presentCount = monthRecords.filter(r => r.status === 'حاضر').length;
    const absentCount = monthRecords.filter(r => r.status === 'غائب').length;
    const totalRecords = presentCount + absentCount;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;
    
    // أكثر الأيام غياباً
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const absencesByDay = [0, 0, 0, 0, 0, 0, 0];
    
    monthRecords.filter(r => r.status === 'غائب').forEach(r => {
        const day = new Date(r.date).getDay();
        absencesByDay[day]++;
    });
    
    const maxAbsenceDay = absencesByDay.indexOf(Math.max(...absencesByDay));
    const worstDay = absencesByDay[maxAbsenceDay] > 0 ? dayNames[maxAbsenceDay] : '-';
    
    // الطلاب الأكثر غياباً
    const studentAbsences = {};
    students.forEach(s => studentAbsences[s] = 0);
    monthRecords.filter(r => r.status === 'غائب').forEach(r => {
        if (studentAbsences[r.student] !== undefined) {
            studentAbsences[r.student]++;
        }
    });
    
    const topAbsent = Object.entries(studentAbsences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .filter(s => s[1] > 0);
    
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;">
            <div style="background:linear-gradient(135deg,#11998e,#38ef7d);color:white;padding:20px;border-radius:15px;text-align:center;">
                <div style="font-size:2em;font-weight:bold;">${attendanceRate}%</div>
                <div>نسبة الحضور</div>
            </div>
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:20px;border-radius:15px;text-align:center;">
                <div style="font-size:2em;font-weight:bold;">${students.length}</div>
                <div>عدد الطلاب</div>
            </div>
            <div style="background:linear-gradient(135deg,#eb3349,#f45c43);color:white;padding:20px;border-radius:15px;text-align:center;">
                <div style="font-size:2em;font-weight:bold;">${absentCount}</div>
                <div>إجمالي الغياب</div>
            </div>
        </div>
        
        <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:10px;">
            <strong>📅 أكثر يوم غياباً:</strong> ${worstDay} (${absencesByDay[maxAbsenceDay]} غياب)
        </div>
        
        ${topAbsent.length > 0 ? `
        <div style="margin-top:15px;padding:15px;background:#f8d7da;border-radius:10px;">
            <strong>🔴 الأكثر غياباً هذا الشهر:</strong>
            <ul style="margin:10px 0 0 0;padding-right:20px;">
                ${topAbsent.map(s => `<li>${s[0]} (${s[1]} غياب)</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

// حفظ إعدادات التنبيهات
function saveAlertSettings() {
    const limit = document.getElementById('absenceLimit').value;
    localStorage.setItem('absenceLimit', limit);
    alert('تم حفظ الإعدادات');
    loadAlerts();
}

// تحميل التنبيهات
function loadAlerts() {
    const className = document.getElementById('alertsClass').value;
    const container = document.getElementById('alertsList');
    const limit = parseInt(localStorage.getItem('absenceLimit')) || 3;
    
    document.getElementById('absenceLimit').value = limit;
    
    // حساب الشهر الحالي
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    
    const atRiskStudents = [];
    
    const classesToCheck = className === 'all' ? data.classes : [className];
    
    classesToCheck.forEach(cls => {
        const students = data.students[cls] || [];
        students.forEach(student => {
            const absences = data.records.filter(r => 
                r.class === cls && 
                r.student === student && 
                r.status === 'غائب' &&
                r.date >= startDate && 
                r.date <= endDate
            );
            
            if (absences.length >= limit) {
                atRiskStudents.push({
                    class: cls,
                    student: student,
                    count: absences.length,
                    dates: absences.map(a => a.date).filter((v, i, a) => a.indexOf(v) === i)
                });
            }
        });
    });
    
    // ترتيب حسب عدد الغياب
    atRiskStudents.sort((a, b) => b.count - a.count);
    
    if (atRiskStudents.length === 0) {
        container.innerHTML = '<p style="color:green;text-align:center;">✅ لا يوجد طلاب تجاوزوا الحد المسموح للغياب هذا الشهر</p>';
        return;
    }
    
    container.innerHTML = `
        <p style="color:#dc3545;font-weight:bold;margin-bottom:15px;">⚠️ ${atRiskStudents.length} طالب تجاوزوا ${limit} غيابات هذا الشهر</p>
        ${atRiskStudents.map(s => `
            <div class="student-item" style="background:#f8d7da;border-right:4px solid #dc3545;">
                <div>
                    <span class="student-name">${s.student}</span>
                    <span style="color:#666;font-size:12px;display:block;">${s.class}</span>
                </div>
                <div style="text-align:left;">
                    <span style="background:#dc3545;color:white;padding:5px 12px;border-radius:20px;font-weight:bold;">${s.count} غياب</span>
                </div>
            </div>
        `).join('')}
    `;
}

// تهيئة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // تحميل الوضع المظلم
    loadDarkMode();
    
    // تحديث السجلات القديمة
    migrateOldRecords();
    
    updateClassSelects();
    
    // تعيين تاريخ اليوم كافتراضي
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDateFrom').value = today;
    document.getElementById('reportDateTo').value = today;
    
    // تعيين الشهر الحالي
    document.getElementById('reportMonth').value = today.substring(0, 7);
    
    // تحميل إعدادات التنبيهات
    const savedLimit = localStorage.getItem('absenceLimit');
    if (savedLimit) {
        document.getElementById('absenceLimit').value = savedLimit;
    }
});
