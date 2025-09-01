// Abrir modal download
document.getElementById('btnDownloadExtrato').addEventListener('click', () => {
  document.getElementById('modalDownload').style.display = 'flex';
});

// Fechar modal
document.getElementById('fecharModalDownload').addEventListener('click', () => {
  document.getElementById('modalDownload').style.display = 'none';
});

function obterExtratoDaTabela() {
  const tabela = document.querySelector('#extrato tbody');
  const linhas = tabela.querySelectorAll('tr');
  const extrato = [];

  linhas.forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 4) {
      extrato.push({
        tipo: tds[0].textContent.trim(),
        ativo: tds[1].textContent.trim(),
        quantidade: parseInt(tds[2].textContent.trim(), 10),
        valorTotal: parseFloat(tds[3].textContent.trim().replace(',', '.')),
        valorUnitario: 0  // Vamos recalcular isso abaixo
      });
    }
  });

  // Calcular valor unitário para cada operação
  extrato.forEach(op => {
    op.valorUnitario = op.quantidade > 0 ? (op.valorTotal / op.quantidade) : 0;
  });

  return extrato;
}


function baixarJSON() {
  const extrato = obterExtratoDaTabela();

  if (!extrato || extrato.length === 0) {
    alert('Extrato vazio, nada para baixar.');
    return;
  }

  const dataStr = JSON.stringify(extrato, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extrato.json';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('modalDownload').style.display = 'none';
}

function baixarXLSX() {
  const extrato = obterExtratoDaTabela();

  if (!extrato || extrato.length === 0) {
    alert('Extrato vazio, nada para baixar.');
    return;
  }

  const ws_data = extrato.map(op => ({
    Tipo: op.tipo,
    Ativo: op.ativo,
    Quantidade: op.quantidade,
    'Valor Unitário (R$)': op.valorUnitario.toFixed(2),
    'Valor Total (R$)': op.valorTotal.toFixed(2)
  }));

  const ws = XLSX.utils.json_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extrato');

  XLSX.writeFile(wb, 'extrato.xlsx');
  document.getElementById('modalDownload').style.display = 'none';
}


// Eventos dos botões modal
document.getElementById('baixarJSON').addEventListener('click', baixarJSON);
document.getElementById('baixarXLSX').addEventListener('click', baixarXLSX);


    let usuarios = {};
    let usuarioAtual = '';
    let carteira = {};
    let extrato = [];
    let ordens = [];

    var precos = {
      PETR4: 28.50,
      VALE3: 72.30,
      ITUB4: 31.20,
      BBDC4: 27.80,
      ABEV3: 14.25,
      MGLU3: 3.45,
      BBAS3: 49.10,
      LREN3: 18.30
    };

    function debug(msg, data) { console.log('[DEBUG]', msg, data || ''); }
    function loadData() {
      try {
        const u = localStorage.getItem('usuarios');
        if(u) usuarios = JSON.parse(u);
        const ua = localStorage.getItem('usuario_atual');
        if(ua) usuarioAtual = ua;
        const c = localStorage.getItem('carteira_' + usuarioAtual);
        if(c) carteira = JSON.parse(c);
        const e = localStorage.getItem('extrato_' + usuarioAtual);
        if(e) extrato = JSON.parse(e);
        const o = localStorage.getItem('ordens_' + usuarioAtual);
        if(o) ordens = JSON.parse(o);
      } catch(e) { debug('Erro load', e); }
    }

    function preencherAtivos() {
    const sel = document.getElementById('ativo');
    sel.innerHTML = '';
    Object.keys(precos).forEach(ativo => {
      const opt = document.createElement('option');
      opt.value = ativo;
      opt.textContent = ativo;
      sel.appendChild(opt);
    });
     }

    function renderDashboard() {
  document.getElementById('username').textContent = usuarios[usuarioAtual].nome || 'Usuário';
  document.getElementById('saldo').textContent = (usuarios[usuarioAtual].saldo || 0).toFixed(2);

  const tbBook = document.querySelector('#book tbody');
  const tbCarteira = document.querySelector('#carteira tbody');
  const tbExtrato = document.querySelector('#extrato tbody');
  const tbOrdens = document.querySelector('#ordens tbody');
  let totalCarteira = 0;

  [tbBook, tbCarteira, tbExtrato, tbOrdens].forEach(t => t.innerHTML = '');

  // Atualiza o Book de Ofertas usando preços fixos e variação simulada
  Object.entries(precos).forEach(([ativo, preco]) => {
    const varf = +(Math.random() * 10 - 5).toFixed(2);
    tbBook.innerHTML += `<tr>
      <td>${ativo}</td>
      <td>${preco.toFixed(2)}</td>
      <td style="color:${varf >= 0 ? '#2ecc71' : '#e74c3c'};">${varf}%</td>
    </tr>`;
  });

  // Atualiza a Carteira usando preços fixos para calcular o valor total
  Object.entries(carteira).forEach(([ativo, qtd]) => {
    const preco = precos[ativo] || 0; // pega o preço do ativo ou 0 se não existir
    const valTotal = +(qtd * preco).toFixed(2);
    totalCarteira += valTotal;
    tbCarteira.innerHTML += `<tr>
      <td>${ativo}</td>
      <td>${qtd}</td>
      <td>${preco.toFixed(2)}</td>
      <td>${valTotal.toFixed(2)}</td>
    </tr>`;
  });

  document.getElementById('valorTotal').textContent = totalCarteira.toFixed(2);
  document.querySelector('.wallet-card .table-wrapper').style.display = totalCarteira ? '' : 'none';
  document.getElementById('portfolioEmpty').style.display = totalCarteira ? 'none' : 'block';

  extrato.forEach(o => {
    tbExtrato.innerHTML += `<tr><td>${o.tipo}</td><td>${o.ativo}</td><td>${o.qtd}</td><td>${o.total}</td></tr>`;
  });

  ordens.forEach(o => {
    tbOrdens.innerHTML += `<tr>
      <td>${o.tipo}</td>
      <td>${o.ativo}</td>
      <td>${o.qtd}</td>
      <td>${o.preco}</td>
      <td>${o.cotacao || '-'}</td>
      <td>${o.status}</td>
      <td><button class="logout-btn" onclick="cancelarOrdem(${o.id})">Cancelar</button></td>
    </tr>`;
  });

   const linhasBook = document.querySelectorAll('#book tbody tr');
  linhasBook.forEach(linha => {
    linha.onclick = () => {
      const ativoSelecionado = linha.children[0].textContent;
      document.getElementById('ativoSelect').value = ativoSelecionado;
      atualizarGrafico();  // Atualiza o gráfico com o ativo selecionado
    };
  });
}


    function executarOrdem() { 
  const tipo = document.getElementById('tipo').value;
  const ativo = document.getElementById('ativo').value;
  const qtd = parseInt(document.getElementById('quantidade').value);
  const valor = parseFloat(document.getElementById('valor').value);
  const total = +(qtd * valor).toFixed(2);
  let msg = '';

  // ⚠️ Verificação de múltiplo de 100
  if (qtd % 100 !== 0) {
    msg = 'A quantidade deve ser múltiplo de 100';
    document.getElementById('mensagem').textContent = msg;
    return;
  }

  if (tipo === 'Compra') {
    if (usuarios[usuarioAtual].saldo >= total) {
      usuarios[usuarioAtual].saldo -= total;
      carteira[ativo] = (carteira[ativo] || 0) + qtd;
      msg = 'Compra realizada';
      extrato.push({ tipo: 'Compra', ativo, qtd, total });
      ordens.push({
        id: Date.now(),
        tipo,
        ativo,
        qtd,
        preco: valor,
        cotacao: '-',
        status: 'Executada'
      });
    } else {
      msg = 'Saldo insuficiente';
    }
  } else {
    if ((carteira[ativo] || 0) >= qtd) {
      usuarios[usuarioAtual].saldo += total;
      carteira[ativo] -= qtd;
      msg = 'Venda realizada';
      extrato.push({ tipo: 'Venda', ativo, qtd, total });
      ordens.push({
        id: Date.now(),
        tipo,
        ativo,
        qtd,
        preco: valor,
        cotacao: '-',
        status: 'Executada'
      });
    } else {
      msg = 'Quantidade indisponível';
    }
  }

  saveData();
  document.getElementById('mensagem').textContent = msg;
  renderDashboard();
}


    function cancelarOrdem(id) {
      ordens = ordens.map(o => o.id===id ? { ...o, status: 'Cancelada' } : o);
      saveData();
      renderDashboard();
    }

    function toggleSenha() {
      const inp = document.getElementById('novaSenha');
      inp.type = inp.type==='password'?'text':'password';
    }

    function alterarSenha() {
      const ns = document.getElementById('novaSenha').value;
      const msgEl = document.getElementById('senhaMsg');
      if(ns.length < 3) msgEl.textContent = 'Senha curta';
      else {
        usuarios[usuarioAtual].senha = ns;
        saveData();
        msgEl.textContent = 'Senha atualizada';
      }
    }

    function saveData() {
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
      localStorage.setItem('carteira_' + usuarioAtual, JSON.stringify(carteira));
      localStorage.setItem('extrato_' + usuarioAtual, JSON.stringify(extrato));
      localStorage.setItem('ordens_' + usuarioAtual, JSON.stringify(ordens));
    }

    function logout() {
      localStorage.removeItem('usuario_atual');
      return window.location.href = 'index.html';
    }

    function init() {
      loadData();
      if(!usuarioAtual || !usuarios[usuarioAtual]) return logout();
      preencherAtivos();
      renderDashboard();
      setInterval(renderDashboard, 10000);
    }
    window.onload = init;

    function abrirModalSenha() {
  document.getElementById('modalSenha').style.display = 'flex';
}

function fecharModalSenha() {
  document.getElementById('modalSenha').style.display = 'none';
}


let precos_a = {
  PETR4: 28.50,
  VALE3: 72.30,
  ITUB4: 31.20,
  BBDC4: 27.80,
  ABEV3: 14.25,
  MGLU3: 3.45
};

let ativos_a = Object.keys(precos_a);
let dadosGrafico = {};
let grafico;

function inicializarSelectAtivos() {
  const select = document.getElementById('ativoSelect');
  select.innerHTML = '';
  ativos_a.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });

  // Listener ao mudar de ativo
  select.addEventListener('change', () => {
    const ativo = select.value;
    dadosGrafico[ativo] = []; // Zera os dados do ativo selecionado
    destruirGrafico();
    atualizarGrafico();
  });

  // Listener para intervalo
  document.getElementById('intervaloSelect').addEventListener('change', () => {
    atualizarGrafico();
  });
}

function gerarCandle(ativo_a, precoAtual) {
  let agora = new Date();
  let ultimoCandle = dadosGrafico[ativo_a]?.slice(-1)[0];

  let novoCandle = {
    x: agora,
    o: precoAtual,
    h: precoAtual,
    l: precoAtual,
    c: precoAtual
  };

  if (ultimoCandle && (agora - ultimoCandle.x) < 2000) {
    ultimoCandle.h = Math.max(ultimoCandle.h, precoAtual);
    ultimoCandle.l = Math.min(ultimoCandle.l, precoAtual);
    ultimoCandle.c = precoAtual;
  } else {
    if (!dadosGrafico[ativo_a]) dadosGrafico[ativo_a] = [];
    dadosGrafico[ativo_a].push(novoCandle);
  }
}

function destruirGrafico() {
  if (grafico) {
    grafico.destroy();
    grafico = null;
  }
}

function atualizarGrafico() {
  const ativo_a = document.getElementById('ativoSelect').value;
  const intervalo = parseInt(document.getElementById('intervaloSelect').value) * 1000;

  // Pega todos os candles acumulados para o ativo selecionado
  let dadosFiltrados = dadosGrafico[ativo_a] || [];

  // Ordena os candles por tempo (do mais antigo para o mais novo)
  dadosFiltrados.sort((a, b) => a.x - b.x);

  const ctx = document.getElementById('graficoTecnico').getContext('2d');

  // Destrói gráfico antigo para recriar
  if (grafico) {
    grafico.destroy();
  }

  // Define unidade de tempo para eixo X com base no intervalo selecionado
  let unidadeTempo = 'second';
  if (intervalo >= 3600 * 1000) unidadeTempo = 'hour';
  else if (intervalo >= 1800 * 1000) unidadeTempo = 'minute';
  else if (intervalo >= 300 * 1000) unidadeTempo = 'minute';
  else unidadeTempo = 'second';

  grafico = new Chart(ctx, {
    type: 'candlestick',
    data: {
      datasets: [{
        label: ativo_a,
        data: dadosFiltrados,
        barThickness: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          backgroundColor: '#1a1a1a',
          borderColor: '#333',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { weight: 'bold' },
          callbacks: {
            title: function(context) {
              const date = context[0].raw.x;
              return luxon.DateTime.fromJSDate(date).toFormat('dd/MM/yyyy, HH:mm:ss');
            },
            label: function(context) {
              const candle = context.raw;
              return [
                `Abertura: ${candle.o.toFixed(2)}`,
                `Máxima: ${candle.h.toFixed(2)}`,
                `Mínima: ${candle.l.toFixed(2)}`,
                `Fechamento: ${candle.c.toFixed(2)}`
              ];
            },
            labelColor: function(context) {
              const candle = context.raw;
              const isAlta = candle.c >= candle.o;
              return {
                borderColor: isAlta ? 'limegreen' : 'red',
                backgroundColor: isAlta ? 'limegreen' : 'red'
              };
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: unidadeTempo,
            tooltipFormat: 'dd/MM/yyyy, HH:mm:ss',
            displayFormats: {
              hour: 'HH:mm',
              minute: 'HH:mm',
              second: 'HH:mm:ss'
            }
          },
          ticks: {
            color: '#aaa',
            callback: function(value) {
              const date = luxon.DateTime.fromMillis(value);
              if (unidadeTempo === 'hour') {
                return date.toFormat('dd/MM HH:mm');
              } else if (unidadeTempo === 'minute') {
                return date.toFormat('HH:mm');
              } else {
                return date.toFormat('HH:mm:ss');
              }
            }
          },
          grid: { color: '#444' }
        },
        y: {
          ticks: { color: '#aaa' },
          grid: { color: '#444' },
          title: {
            display: true,
            text: 'Preço',
            color: '#aaa'
          }
        }
      },
      onClick: (evt, elements, chart) => {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false);
        if (points.length) {
          const index = points[0].index;
          const dataset = chart.data.datasets[0];
          const candle = dataset.data[index];
          const canvasPosition = Chart.helpers.getRelativePosition(evt, chart);

          const hora = luxon.DateTime.fromJSDate(candle.x).toFormat('dd/MM/yyyy, HH:mm:ss');

          const popup = document.getElementById('popupCandle');
          popup.innerHTML = `
            <div style="color: #00ffff;"><strong>${hora}</strong></div>
            <div style="color: limegreen;">Abertura: ${candle.o.toFixed(2)}</div>
            <div style="color: limegreen;">Máxima: ${candle.h.toFixed(2)}</div>
            <div style="color: red;">Mínima: ${candle.l.toFixed(2)}</div>
            <div style="color: limegreen;">Fechamento: ${candle.c.toFixed(2)}</div>
          `;

          const rect = chart.canvas.getBoundingClientRect();

          popup.style.left = (rect.left + canvasPosition.x + 10) + 'px';
          popup.style.top = (rect.top + canvasPosition.y - 50) + 'px';
          popup.style.display = 'block';
        } else {
          // Fecha popup ao clicar fora
          document.addEventListener('click', function (e) {
            const popup = document.getElementById('popupCandle');
            const canvas = document.getElementById('graficoTecnico');
            if (!canvas.contains(e.target)) {
              popup.style.display = 'none';
            }
          });
        }
      }
    }
  });
}


let intervaloAtual = parseInt(document.getElementById('intervaloSelect').value) * 1000;
let intervaloTimer;

function iniciarIntervaloTimer() {
  if (intervaloTimer) clearInterval(intervaloTimer);
  intervaloTimer = setInterval(() => {
    ativos_a.forEach(ativo_a => {
      gerarCandle(ativo_a);
    });
    atualizarGrafico();
  }, intervaloAtual);
}


document.getElementById('intervaloSelect').addEventListener('change', () => {
  intervaloAtual = parseInt(document.getElementById('intervaloSelect').value) * 1000;
  iniciarIntervaloTimer();
});


document.addEventListener('DOMContentLoaded', () => {
  inicializarSelectAtivos();
  iniciarIntervaloTimer();
  atualizarGrafico();
});


// Ajustar atualizarPrecosEGrafico para gerar candles respeitando o intervalo:
function atualizarPrecosEGrafico() {
  ativos_a.forEach(ativo_a => {
    gerarCandle(ativo_a);
  });
  atualizarGrafico();
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarSelectAtivos();
  iniciarIntervaloTimer();
  atualizarGrafico();
});


function gerarCandle(ativo_a) {
  const agora = new Date();

  const historico = dadosGrafico[ativo_a] || [];
  const ultimo = historico.length > 0 ? historico[historico.length - 1] : null;
  const abertura = ultimo ? ultimo.c : precos_a[ativo_a];

  // Define variação aleatória entre 5 e 30
  const variacao = 5 + Math.random() * 25;

  // Decide se o candle será de alta ou baixa
  const subir = Math.random() >= 0.5;
  const fechamento = subir ? abertura + variacao : abertura - variacao;

  // Define máxima e mínima com leve variação aleatória
  const maximo = Math.max(abertura, fechamento) + Math.random() * 2;
  const minimo = Math.min(abertura, fechamento) - Math.random() * 2;

  // Cria novo candle
  const candle = {
    x: agora,
    o: parseFloat(abertura.toFixed(2)),
    c: parseFloat(fechamento.toFixed(2)),
    h: parseFloat(maximo.toFixed(2)),
    l: parseFloat(minimo.toFixed(2))
  };

  if (!dadosGrafico[ativo_a]) dadosGrafico[ativo_a] = [];

  dadosGrafico[ativo_a].push(candle);
  precos_a[ativo_a] = candle.c;
}

document.getElementById('infoCandle').innerHTML = '';


