javascript:(function () {
  const MyIRR = {};

  // IRR 核心算法
  MyIRR.irr = function (cashflows, guessList = [0.1, 0.2, 0.4, 0.6, 0.8]) {
    const tol = 1e-7, maxIter = 1000;
    function npv(rate) {
      return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
    }
    function derivative(rate) {
      return cashflows.reduce((acc, val, i) => {
        if (i === 0) return acc;
        return acc - i * val / Math.pow(1 + rate, i + 1);
      }, 0);
    }
    for (let guess of guessList) {
      let rate = guess;
      for (let i = 0; i < maxIter; i++) {
        const f = npv(rate), f1 = derivative(rate);
        if (!isFinite(f1) || Math.abs(f1) < 1e-10) break;
        const newRate = rate - f / f1;
        if (!isFinite(newRate)) break;
        if (Math.abs(newRate - rate) < tol) return newRate;
        rate = newRate;
      }
    }
    return null;
  };

  // 默认计算执行函数
  MyIRR.runDefault = function () {
    const cashflows = [];
    const outBox = $axure('@irrOut');
    const yearBox = $axure('@maxYears');
    const profit0Box = $axure('@profit0');
    const moneyInBox = $axure('@moneyIn');
    const moneyOutBox = $axure('@moneyOut');

    let totalIn = 0;
    let totalOut = 0;

    if (!outBox || !yearBox || !profit0Box || typeof yearBox.text !== 'function' || typeof profit0Box.text !== 'function') {
      console.error('组件缺失或text方法错误，请检查命名：@irrOut、@maxYears、@profit0');
      return;
    }

    const yearText = yearBox.text();
    if (!yearText || typeof yearText !== 'string') {
      outBox.text('❌ 运营年限无效');
      return;
    }

    const maxYears = parseInt(yearText.trim(), 10);
    if (isNaN(maxYears) || maxYears < 0 || maxYears > 50) {
      outBox.text('❌ 请输入有效的运营年限（0~50）');
      return;
    }

    const profit0Text = profit0Box.text();
    if (!profit0Text || typeof profit0Text !== 'string') {
      outBox.text('❌ 建设期现金流格式错误');
      return;
    }

    const profit0 = parseFloat(profit0Text.trim().replace(/,/g, ''));
    if (isNaN(profit0)) {
      outBox.text('❌ 建设期现金流不是有效数字');
      return;
    }
    cashflows.push(profit0);
    if (profit0 > 0) totalIn += profit0;
    else if (profit0 < 0) totalOut += profit0;

    for (let i = 1; i <= maxYears; i++) {
      const box = $axure(`@profit${i}`);
      if (!box || typeof box.text !== 'function') {
        console.warn(`跳过：未找到 @profit${i}`);
        continue;
      }
      const text = box.text();
      if (!text || typeof text !== 'string') {
        console.warn(`跳过：@profit${i} 无法读取`);
        continue;
      }
      const val = parseFloat(text.trim().replace(/,/g, ''));
      if (isNaN(val)) {
        console.warn(`跳过：@profit${i} 值非法`);
        continue;
      }
      cashflows.push(val);
      if (val > 0) totalIn += val;
      else if (val < 0) totalOut += val;
    }

    // 计算并输出 IRR
    const irr = MyIRR.irr(cashflows);
    const result = irr != null ? (irr * 100).toFixed(2) + '%' : '❌ IRR 计算失败：现金流无效或始终为负';
    outBox.text(result);

    // 输出 moneyIn / moneyOut
    if (moneyInBox && typeof moneyInBox.text === 'function') {
      moneyInBox.text(totalIn.toFixed(2));
    }
    if (moneyOutBox && typeof moneyOutBox.text === 'function') {
      moneyOutBox.text(Math.abs(totalOut).toFixed(2));
    }
  };

  // 全局挂载
  window.myAxHelper = MyIRR;


// === 税金同步功能：从 incomeRepeater 和 costRepeater 写入 taxRepeater ===
myAxHelper.safeGetValueFromRepeater = function (repeaterName, yearText, fieldLabel) {
  const $rows = $('[data-label="' + repeaterName + '"]').find('tr');
  for (let i = 0; i < $rows.length; i++) {
    const $row = $rows.eq(i);
    const $year = $row.find('[data-label="yearsName"]');
    if ($year.length && $year.text().trim() === yearText) {
      const $valWidget = $row.find('[data-label="' + fieldLabel + '"]');
      if ($valWidget.length) {
        const text = $valWidget.text().trim().replace(/,/g, '');
        const val = parseFloat(text);
        return isNaN(val) ? 0 : val;
      }
    }
  }
  return 0;
};

myAxHelper.syncTaxToRepeater = function () {
  const taxRepeater = $axure('@taxRepeater');
  if (!taxRepeater || typeof taxRepeater.editRepeaterData !== 'function') {
    console.error('找不到 taxRepeater 或其不支持 editRepeaterData');
    return;
  }

  const rows = $('[data-label="taxRepeater"]').find('tr');
  rows.each(function (i, rowEl) {
    const $row = $(rowEl);
    const yearText = $row.find('[data-label="yearsName"]').text().trim();
    if (!yearText) return;

    const vatOut = myAxHelper.safeGetValueFromRepeater('incomeRepeater', yearText, 't_销项税');
    const opexTax = myAxHelper.safeGetValueFromRepeater('costRepeater', yearText, 't4_运维税额');
    const insuranceTax = myAxHelper.safeGetValueFromRepeater('costRepeater', yearText, 't4_保险税额');
    const landTax = myAxHelper.safeGetValueFromRepeater('costRepeater', yearText, 't4_土地税额');
    const otherTax = myAxHelper.safeGetValueFromRepeater('costRepeater', yearText, 't4_其他税额');
    const vatIn = opexTax + insuranceTax + landTax + otherTax;

    taxRepeater.editRepeaterData(i, {
      vatOut: vatOut.toFixed(2),
      vatIn: vatIn.toFixed(2)
    });
  });
};

})();
