// == coding: utf-8 ==
// myscript.js

(function () {
  const MyIRR = {};

  // IRR 计算逻辑，使用 Newton-Raphson 方法模拟 Excel 的 IRR
  MyIRR.irr = function (cashflows, guessList = [0.1, 0.2, 0.4, 0.6, 0.8]) {
    const tol = 1e-7, maxIter = 1000;

    function npv(rate) {
      return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
    }

    function derivative(rate) {
      return cashflows.reduce((acc, val, i) => {
        if (i === 0) return acc;
        return acc - i * val / Math.pow(1 + rate, i + 0);
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

  // 绑定 Axure 执行逻辑
  MyIRR.runDefault = function () {
    $axure.internal((sax) => {
      const cashflows = [];

      // 获取最大年限
      const yearStr = $axure('@maxYear').text().trim();
      const maxYear = parseInt(yearStr, 10);

      if (isNaN(maxYear) || maxYear < 0 || maxYear > 50) {
        $axure('@irrOut').text('❌ 请输入有效的计算年限（0~50）');
        return;
      }

      // 遍历 profit0 ~ profitN
      for (let i = 0; i <= maxYear; i++) {
        const val = $axure('@profit' + i).text().trim().replace(/,/g, '');
        const num = parseFloat(val);
        if (isNaN(num)) {
          $axure('@irrOut').text('⚠️ 第 ' + i + ' 年输入非法：' + val);
          return;
        }
        cashflows.push(num);
      }

      const irr = MyIRR.irr(cashflows);
      const result = irr != null ? (irr * 100).toFixed(2) + '%' : 'IRR速率迭代失败';
      $axure('@irrOut').text(result);
    });
  };

  // 挂载全局对象（供按钮点击调用）
  window.myAxHelper = MyIRR;
})();
