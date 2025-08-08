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
      if(tipo==='Compra') {
        if(usuarios[usuarioAtual].saldo >= total) {
          usuarios[usuarioAtual].saldo -= total;
          carteira[ativo] = (carteira[ativo]||0)+qtd;
          msg = 'Compra realizada';
          extrato.push({ tipo:'Compra', ativo, qtd, total });
          ordens.push({ id: Date.now(), tipo, ativo, qtd, preco: valor, cotacao: '-', status: 'Executada' });
        } else msg = 'Saldo insuficiente';
      } else {
        if((carteira[ativo]||0)>=qtd) {
          usuarios[usuarioAtual].saldo += total;
          carteira[ativo] -= qtd;
          msg = 'Venda realizada';
          extrato.push({ tipo:'Venda', ativo, qtd, total });
          ordens.push({ id: Date.now(), tipo, ativo, qtd, preco: valor, cotacao: '-', status: 'Executada' });
        } else msg = 'Quantidade indisponível';
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
