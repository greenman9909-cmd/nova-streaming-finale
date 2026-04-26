fetch('https://streamingnova.es/api/auth/verify-captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'test' })
}).then(res => res.text().then(text => console.log(res.status, text)));
