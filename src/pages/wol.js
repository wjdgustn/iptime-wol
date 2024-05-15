export default (env, devices) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WoL</title>
    
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        [...document.getElementsByClassName('wol')].forEach(el => {
            el.addEventListener('click', async () => {
                await fetch('/api/wol/' + el.dataset.mac, {
                    method: 'POST',
                    headers: {
                        Authorization: '${env.API_KEY}'
                    }
                });
            });
        });
    });
    </script>
</head>

<body>
<h1>WoL</h1>
${devices.map(d => `
<div>
    <h3>
        <button class="wol" data-mac="${d.mac}">Wake Up!</button>
        ${d.name}
    </h3>
</div>
`.trim()).join('\n')}
</body>
</html>
`.trim();