// myscript.js
(function () {
  const MyIRR = {};

  // 核心计算函数：近似 Excel IRR，支持多 guess，避免除0
  MyIRR.irr = function (cashflows, guessList = [0.1, 0.2, 0.4, 0.6, 0.8]) {
    const tol = 1e-7;
    const maxIter = 1000;

    function npv(rate) {
      return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
    }

    function derivative(rate) {
      return cashflows.reduce((acc, val, i) => {
        if (i === 0) return acc;
        return acc - i * val * i / Math.pow(1 + rate, i + 1);
      }, 0);
    }

    for (let guess of guessList) {
      let rate = guess;
      for (let i = 0; i < maxIter; i++) {
        const f = npv(rate);
        const f1 = derivative(rate);
        if (Math.abs(f1) < 1e-10) break;
        const newRate = rate - f / f1;
        if (Math.abs(newRate - rate) < tol) return newRate;
        rate = newRate;
      }
    }

    return null;
  };

  // 计算并输出到指定组件
  MyIRR.run = function (inputIds, outputId) {
    try {
      const cashflows = inputIds.map(id => {
        const raw = $axure(id).text().trim();
        const num = parseFloat(raw.replace(/,/g, ''));
        if (isNaN(num)) throw new Error(`输入无效：${id}`);
        return num;
      });

      const result = MyIRR.irr(cashflows);

      if (result == null || isNaN(result)) {
        $axure(outputId).text('IRR计算失败（无解）');
      } else {
        $axure(outputId).text((result * 100).toFixed(2) + '%');
      }
    } catch (err) {
      $axure(outputId).text(err.message || 'IRR异常');
    }
  };

  // 预设默认组件名（适用于 cf0~cf10 + irrOut）
  MyIRR.runDefault = function () {
    const inputs = [];
    for (let i = 0; i <= 10; i++) inputs.push(`@cf${i}`);
    MyIRR.run(inputs, '@irrOut');
  };

  // 暴露给全局调用
  window.myAxHelper = MyIRR;
})();
