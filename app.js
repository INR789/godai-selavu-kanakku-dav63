export async function init(db) {
  const $ = id => document.getElementById(id);
  const categories = ['உணவு','மளிகை','பயணம்','வீடு','மருத்துவம்','கல்வி','பொழுதுபோக்கு','மற்றவை'];
  const icons = ['🍽','🛒','🚌','🏠','✚','📚','♫','₹'];
  const money = n => new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:2}).format(n);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  let user = null, rows = [], editing = null, signup = false, version = 0, pendingDelete = null, timer;

  function notify(text) {
    $('message').textContent = text;
    $('message').hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { $('message').hidden = true; }, 6500);
  }
  function error() { notify('செயலை முடிக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.'); }
  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function validDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const d = new Date(date + 'T12:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === date;
  }
  categories.forEach(c => {
    $('category').add(new Option(c,c));
    $('filter').add(new Option(c,c));
  });
  $('month').value = today().slice(0,7);
  $('date').value = today();

  function reset() {
    editing = null;
    $('expense-form').reset();
    $('date').value = today();
    $('entry-title').textContent = 'புதிய செலவு';
    $('save').textContent = 'செலவைச் சேமி';
    $('cancel-edit').hidden = true;
  }
  function render() {
    const month = $('month').value;
    const selected = rows.filter(r => r.date.startsWith(month+'-')).sort((a,b) => b.date.localeCompare(a.date));
    const total = selected.reduce((s,r) => s+Number(r.amount),0);
    const totals = categories.map(c => ({name:c,total:selected.filter(r => r.category===c).reduce((s,r) => s+Number(r.amount),0)})).sort((a,b) => b.total-a.total);
    $('total').textContent = money(total);
    $('count').textContent = selected.length;
    $('month-caption').textContent = month ? new Intl.DateTimeFormat('ta-IN',{month:'long',year:'numeric'}).format(new Date(month+'-01T12:00:00')) : '';
    $('top-category').textContent = total ? totals[0].name : '—';
    $('top-amount').textContent = total ? money(totals[0].total) : 'இன்னும் பதிவுகள் இல்லை';
    $('bars').replaceChildren();
    if (!total) $('bars').append(el('div','இந்த மாதத்தில் செலவுகள் இல்லை. முதல் செலவைப் பதிவு செய்யுங்கள்.','empty'));
    totals.filter(c => c.total>0).forEach(c => {
      const row = el('div',undefined,'bar-row'), label = el('div',undefined,'bar-label'), track = el('div',undefined,'track'), fill = el('div',undefined,'fill');
      label.append(el('span',c.name),el('strong',`${money(c.total)} · ${Math.round(c.total/total*100)}%`));
      fill.style.width = (c.total/total*100)+'%';
      track.append(fill);
      row.append(label,track);
      $('bars').append(row);
    });
    const filtered = selected.filter(r => !$('filter').value || r.category===$('filter').value);
    $('list-caption').textContent = `${filtered.length} பதிவுகள் · ${money(filtered.reduce((s,r) => s+Number(r.amount),0))}`;
    $('records').replaceChildren();
    if (!filtered.length) $('records').append(el('div','இந்தத் தேர்வில் செலவுப் பதிவுகள் இல்லை.','empty'));
    filtered.forEach(r => {
      const item = el('article',undefined,'expense'), info = el('div',undefined,'expense-info'), actions = el('div',undefined,'expense-actions');
      info.append(el('strong',r.description||r.category),el('small',`${r.category} · ${new Intl.DateTimeFormat('ta-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(r.date+'T12:00:00'))}`));
      const edit = el('button','திருத்து','outline'), del = el('button','நீக்கு','outline');
      edit.onclick = () => {
        editing = r.id;
        $('amount').value = r.amount;
        $('date').value = r.date;
        $('category').value = r.category;
        $('description').value = r.description||'';
        $('entry-title').textContent = 'செலவைத் திருத்து';
        $('save').textContent = 'மாற்றத்தைச் சேமி';
        $('cancel-edit').hidden = false;
        $('expense-form').scrollIntoView({behavior:'smooth',block:'center'});
        $('amount').focus({preventScroll:true});
      };
      del.onclick = () => { pendingDelete = r.id; $('delete-dialog').showModal(); };
      actions.append(edit,del);
      item.append(el('span',icons[categories.indexOf(r.category)]||'₹','expense-icon'),info,el('span',money(Number(r.amount)),'expense-money'),actions);
      $('records').append(item);
    });
  }
  async function load() {
    if (!user) return;
    const v = ++version;
    $('refresh').disabled = true;
    try {
      const result = await db.list('expenses');
      if (v!==version || !user) return;
      rows = result.filter(r => r && Number.isFinite(Number(r.amount)) && Number(r.amount)>0 && validDate(r.date) && categories.includes(r.category));
      render();
    } catch (e) {
      if (v===version) {
        $('records').replaceChildren(el('div','பதிவுகளை ஏற்ற முடியவில்லை. “புதுப்பி” பொத்தானை அழுத்துங்கள்.','empty'));
        error();
      }
    } finally {
      if (v===version) $('refresh').disabled = false;
    }
  }
  async function session(next) {
    const changed = user?.id !== next?.id;
    user = next;
    $('auth').hidden = !!user;
    $('dashboard').hidden = !user;
    $('logout').hidden = !user;
    if (!user) {
      version++;
      rows = [];
      reset();
      pendingDelete = null;
      $('delete-dialog').close();
      $('refresh').disabled = false;
      $('user-email').textContent = '';
      render();
      return;
    }
    $('user-email').textContent = user.email||'';
    if (changed || !rows.length) { rows = []; reset(); render(); await load(); }
  }

  $('auth-toggle').onclick = () => {
    signup = !signup;
    $('auth-title').textContent = signup ? 'புதிய தொடக்கம்' : 'மீண்டும் வருக!';
    $('auth-description').textContent = signup ? 'உங்கள் செலவுகளுக்கென ஒரு கணக்கை உருவாக்குங்கள்.' : 'உங்கள் கணக்கில் உள்நுழையுங்கள்.';
    $('auth-submit').textContent = signup ? 'கணக்கை உருவாக்கு' : 'உள்நுழை';
    $('auth-toggle').textContent = signup ? 'ஏற்கெனவே கணக்கு உள்ளதா? உள்நுழை' : 'புதிய பயனரா? கணக்கை உருவாக்கு';
    $('password').autocomplete = signup ? 'new-password' : 'current-password';
  };
  $('auth-form').onsubmit = async e => {
    e.preventDefault();
    $('auth-submit').disabled = true;
    $('auth-toggle').disabled = true;
    try {
      if (signup) {
        await db.signUp($('email').value.trim(),$('password').value);
        notify('கணக்கு உருவாக்கம் சமர்ப்பிக்கப்பட்டது. தேவைப்பட்டால் மின்னஞ்சலை உறுதிப்படுத்தி உள்நுழையுங்கள்.');
      } else {
        await db.signIn($('email').value.trim(),$('password').value);
      }
      $('password').value = '';
      await session(await db.user());
    } catch (e) {
      notify('உள்நுழைவு / பதிவு தோல்வியடைந்தது. மின்னஞ்சல், கடவுச்சொல் மற்றும் மின்னஞ்சல் உறுதிப்படுத்தலைச் சரிபாருங்கள்.');
    } finally {
      $('auth-submit').disabled = false;
      $('auth-toggle').disabled = false;
    }
  };
  $('logout').onclick = async () => {
    $('logout').disabled = true;
    try {
      await db.signOut();
      await session(null);
      notify('பாதுகாப்பாக வெளியேறிவிட்டீர்கள்.');
    } catch (e) { error(); }
    finally { $('logout').disabled = false; }
  };
  $('expense-form').onsubmit = async e => {
    e.preventDefault();
    if (!user || $('save').disabled) return;
    const amount = Number($('amount').value), date = $('date').value;
    if (!Number.isFinite(amount) || amount<0.01 || amount>999999999 || !validDate(date) || !categories.includes($('category').value)) return;
    const data = {amount:Math.round(amount*100)/100,date,category:$('category').value,description:$('description').value.trim()};
    const id = editing, owner = user.id;
    $('save').disabled = true;
    $('cancel-edit').disabled = true;
    try {
      if (id !== null) await db.update(id,data);
      else await db.add('expenses',data);
      if (user?.id!==owner) return;
      reset();
      $('month').value = date.slice(0,7);
      $('filter').value = '';
      notify(id !== null ? 'மாற்றங்கள் சேமிக்கப்பட்டன.' : 'செலவு சேமிக்கப்பட்டது.');
      await load();
    } catch (e) { error(); }
    finally {
      $('save').disabled = false;
      $('cancel-edit').disabled = false;
    }
  };
  $('cancel-edit').onclick = reset;
  $('month').onchange = () => {
    if (!$('month').value) $('month').value = today().slice(0,7);
    render();
  };
  $('filter').onchange = render;
  $('refresh').onclick = load;
  $('keep').onclick = () => $('delete-dialog').close();
  $('delete-dialog').onclose = () => { pendingDelete = null; };
  $('delete-dialog').oncancel = e => { if ($('confirm-delete').disabled) e.preventDefault(); };
  $('confirm-delete').onclick = async () => {
    if (pendingDelete === null || !user || $('confirm-delete').disabled) return;
    const id = pendingDelete, owner = user.id;
    $('confirm-delete').disabled = true;
    $('keep').disabled = true;
    try {
      await db.remove(id);
      $('delete-dialog').close();
      if (user?.id!==owner) return;
      if (editing===id) reset();
      notify('செலவு நீக்கப்பட்டது.');
      await load();
    } catch (e) { error(); }
    finally {
      $('confirm-delete').disabled = false;
      $('keep').disabled = false;
    }
  };

  $('connection').textContent = 'பாதுகாப்பான கணக்கு சேவை இணைக்கப்பட்டுள்ளது.';
  try {
    await session(await db.user());
    db.onAuth(next => { session(next).catch(error); });
  } catch (e) {
    $('connection').textContent = 'கணக்கு நிலையைப் பெற முடியவில்லை. மீண்டும் உள்நுழைய முயலுங்கள்.';
  } finally {
    $('auth-submit').disabled = false;
    $('auth-toggle').disabled = false;
  }
}
