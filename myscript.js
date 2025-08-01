(function () {
  // 定义全局对象 MyIRR，挂载计算方法
  const MyIRR = {};

  /**
   * IRR 计算函数
   * @param {number[]} cashflows - 从第0年开始的现金流数组
   * @param {number[]} guessList - 初始猜测列表
   */
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

  /**
   * runDefault：Axure按钮点击后执行
   */
  MyIRR.runDefault = function () {
    const outBox = $axure('@irrOut');
    const yearBox = $axure('@maxYears'); 
    const profit0Box = $axure('@profit0');

    if (!outBox || !yearBox || !profit0Box) {
      console.error('缺少关键组件：@irrOut、@maxYears、@profit0');
      return;
    }

    // 获取运营年限
    const maxYears = parseInt(yearBox.text().trim(), 10);
    if (isNaN(maxYears) || maxYears < 0 || maxYears > 50) {
      outBox.text('❌ 请输入有效的运营年限（0~50）');
      return;
    }

    // 获取建设期现金流
    const profit0 = parseFloat(profit0Box.text().trim().replace(/,/g, ''));
    if (isNaN(profit0)) {
      outBox.text('❌ 建设期现金流（profit0）不是有效数字');
      return;
    }

    const cashflows = [profit0];

    // 获取每年运营期现金流 profit1 ~ profitN
    for (let i = 1; i <= maxYears; i++) {
      const box = $axure(`@profit${i}`);
      if (!box || !box.text) break;
      const val = parseFloat(box.text().trim().replace(/,/g, ''));
      if (isNaN(val)) {
        outBox.text(`❌ 第 ${i} 年现金流（profit${i}）不合法`);
        return;
      }
      cashflows.push(val);
    }

    // 调用 IRR 函数进行计算
    const irr = MyIRR.irr(cashflows);

    if (irr == null) {
      if (cashflows.every(v => v <= 0)) {
        outBox.text('❌ 所有现金流均为负或零，无法定义IRR');
      } else {
        outBox.text('❌ IRR 计算失败，可能无解');
      }
    } else {
      outBox.text((irr * 100).toFixed(2) + '%');
    }
  };

  // 注册全局入口
  window.myAxHelper = MyIRR;
})();
