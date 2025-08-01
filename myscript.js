(function () {
  const MyIRR = {};

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
    $axure.internal($ax => {
      const cashflows = [];

      // 获取最大年限输入
      let maxYears = 25;
      try {
        const val = $axure('@maxYears')?.text?.().trim();
        const parsed = parseInt(val);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
          maxYears = parsed;
        }
      } catch (e) {
        // fallback: 保持 maxYears = 25
      }

      for (let i = 1; i <= maxYears; i++) {
        const id = '@profit' + i;
        const widget = $axure(id);
        if (!widget || typeof widget.text !== 'function') continue;

        const raw = widget.text();
        if (typeof raw !== 'string') continue;

        const val = raw.trim().replace(/,/g, '');
        if (val === '') continue;

        const num = parseFloat(val);
        if (isNaN(num)) {
          $axure('@irrOut').text(`无效输入 @profit${i}：${val}`);
          $axure('@irrYears').text('');
          return;
        }

        cashflows.push(num);
      }

      if (cashflows.length === 0) {
        $axure('@irrOut').text('无有效现金流输入');
        $axure('@irrYears').text('');
        return;
      }

      const irr = MyIRR.irr(cashflows);
      const result = irr != null ? (irr * 100).toFixed(2) + '%' : 'IRR计算失败';

      $axure('@irrOut').text(result);
      $axure('@irrYears').text(`共计算 ${cashflows.length} 年现金流`);
    });
  };

  window.myAxHelper = MyIRR;
})();
