(function () {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlNfQxB4svOM2_jH0ruktKffVBVUhETzwKTjzcSHEBH3FsxJQwCnwelWd02Td1JgTqXg/exec';
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfiuy_hjZHpYYZ6qT2JrTBQt3gJdtM6Zdn1vgRrhUS1Fc1W4g/viewform';

  const $ = function (id) { return document.getElementById(id); };
  const form = $('expense-form');
  const employeeSelect = $('employee');
  const expenseTypeSelect = $('expense-type');
  const amountInput = $('amount');
  const receiptInput = $('receipt');
  const filePreview = $('file-preview');
  const submitBtn = $('submit-btn');
  const submitText = $('submit-text');
  const spinner = $('spinner');
  const successToast = $('success-toast');
  const errorToast = $('error-toast');
  const errorMsg = $('error-message-text');

  $('date-display').textContent = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  var fields = [
    { el: employeeSelect, err: 'employee-error', group: employeeSelect.closest('.form-group') },
    { el: expenseTypeSelect, err: 'expense-type-error', group: expenseTypeSelect.closest('.form-group') },
    { el: amountInput, err: 'amount-error', group: amountInput.closest('.form-group') },
    { el: receiptInput, err: null, group: receiptInput.closest('.form-group') }
  ];

  function validate(f) {
    var ok = true;
    if (f.el === employeeSelect && !f.el.value) ok = false;
    else if (f.el === expenseTypeSelect && !f.el.value) ok = false;
    else if (f.el === amountInput && (!f.el.value || parseFloat(f.el.value) <= 0)) ok = false;
    else if (f.el === receiptInput) { return true; }
    f.group.classList.toggle('error', !ok);
    return ok;
  }

  function validateAll() {
    return fields.reduce(function (a, f) { return validate(f) && a; }, true);
  }

  fields.forEach(function (f) {
    f.el.addEventListener('change', function () { validate(f); });
    if (f.el === amountInput) f.el.addEventListener('input', function () { validate(f); });
  });

  receiptInput.addEventListener('change', function () {
    var file = this.files[0];
    filePreview.innerHTML = '';
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        filePreview.innerHTML = '<img src="' + e.target.result + '" alt="صورة الإيصال" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px">';
        filePreview.classList.add('show');
      };
      reader.readAsDataURL(file);
    } else {
      filePreview.classList.remove('show');
    }
    validate(fields[3]);
  });

  function toast(el, isError) {
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, isError ? 4000 : 3000);
  }

  function loading(v) {
    submitBtn.disabled = v;
    submitText.textContent = v ? 'جاري الإرسال...' : 'تسجيل المصروف';
    spinner.classList.toggle('hidden', !v);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateAll()) return;

    var file = receiptInput.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      errorMsg.textContent = 'حجم الصورة كبير جداً (أقصى 10MB)';
      toast(errorToast, true);
      return;
    }

    loading(true);

    try {
      var receiptData = '', receiptName = '';
      if (file) {
        receiptName = file.name;
        receiptData = await new Promise(function (r) {
          var fr = new FileReader();
          fr.onload = function (e) { r(e.target.result); };
          fr.readAsDataURL(file);
        });
      }

      var res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          employee: employeeSelect.value,
          expenseType: expenseTypeSelect.value,
          amount: amountInput.value,
          receiptData: receiptData,
          receiptName: receiptName,
          timestamp: new Date().toISOString()
        })
      });

      var result = await res.json();
      if (result.status !== 'success') throw new Error('فشل الإرسال');

      form.reset();
      filePreview.innerHTML = '';
      filePreview.classList.remove('show');
      fields.forEach(function (f) { f.group.classList.remove('error'); });
      toast(successToast, false);
    } catch (err) {
      errorMsg.textContent = APPS_SCRIPT_URL === '___SCRIPT_URL___'
        ? 'لم يتم إعداد الرابط بعد - اتبع التعليمات لربط التطبيق'
        : 'حدث خطأ في الاتصال، حاول مرة أخرى';
      toast(errorToast, true);
    } finally {
      loading(false);
    }
  });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(function () {});
})();
