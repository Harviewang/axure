javascript:(function () {
  const MyIRR = {};

  // IRR计算主函数
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

  MyIRR.runDefault = function () {
    const cashflows = [];
    const outBox = $axure('@irrOut');
    const yearBox = $axure('@maxYears');
    const profit0Box = $axure('@profit0');

    // 组件是否都存在，且含有 text 方法
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
    }

    const irr = MyIRR.irr(cashflows);
    const result = irr != null ? (irr * 100).toFixed(2) + '%' : '❌ IRR 计算失败：现金流无效或始终为负';
    outBox.text(result);
  };

  window.myAxHelper = MyIRR;
})();
