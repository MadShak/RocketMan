let requests = JSON.parse(localStorage.getItem('requests')) || [];
let accessToken = localStorage.getItem('accessToken') || '';
let selectedIndex = parseInt(localStorage.getItem('selectedIndex'), 10) || 0;

function saveRequests() {
    localStorage.setItem('requests', JSON.stringify(requests));
}

function saveAccessToken(token) {
    accessToken = token;
    localStorage.setItem('accessToken', token);
}

function saveSelectedIndex(index) {
    selectedIndex = index;
    localStorage.setItem('selectedIndex', index);
}

function addRequest() {
    requests.push({
        name: 'New Request',
        method: 'GET',
        url: '',
        body: '',
        headers: 'Content-Type: application/json\nAccept: application/json',
        response: ''
    });
    saveRequests();
    updateRequestSelector();
    renderRequests();
    selectRequest(requests.length - 1);
}

function removeRequest(index) {
    if (requests.length > 1) {
        requests.splice(index, 1);
        saveRequests();
        updateRequestSelector();
        const newIndex = Math.max(index - 1, 0);
        selectRequest(newIndex);
        saveSelectedIndex(newIndex);
    }
}

function resetRequest(index) {
    requests[index] = {
        name: 'New Request',
        method: 'GET',
        url: '',
        body: '',
        headers: 'Content-Type: application/json\nAccept: application/json',
        response: ''
    };
    saveRequests();
    renderRequests();
    updateRequestSelector();
    selectRequest(index);
    saveSelectedIndex(index);
}

function updateRequest(index, key, value) {
    requests[index][key] = value;
    saveRequests();
    renderRequests();
    updateRequestSelector();
    selectRequest(index);
    saveSelectedIndex(index);
}

function sendRequest(index) {
    const request = requests[index];
    const headers = request.headers.split('\n').reduce((acc, line) => {
        const [key, value] = line.split(':').map(str => str.trim());
        if (key && value) acc[key] = value;
        return acc;
    }, {});

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    fetch(request.url, {
        method: request.method,
        headers: headers,
        body: request.method === 'GET' ? null : request.body
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            saveAccessToken(data.access_token);
        }
        request.response = JSON.stringify(data, null, 2);
        saveRequests();
        renderRequests();
        selectRequest(index);
    })
    .catch(error => {
        request.response = error.toString();
        saveRequests();
        renderRequests();
        selectRequest(index);
    });
}

function renderRequests() {
    const container = document.getElementById('selected-request-container');
    container.innerHTML = '';

    requests.forEach((request, index) => {
        const requestElement = document.createElement('div');
        requestElement.className = 'request';
        requestElement.dataset.index = index;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-request-button';
        removeButton.innerText = '×';
        removeButton.onclick = () => removeRequest(index);

        const reloadButton = document.createElement('button');
        reloadButton.className = 'reload-request-button';
        reloadButton.innerText = '↻';
        reloadButton.onclick = () => resetRequest(index);

        const requestName = document.createElement('input');
        requestName.className = 'request-name';
        requestName.type = 'text';
        requestName.value = request.name;
        requestName.onchange = (event) => {
            updateRequest(index, 'name', event.target.value);
        };

        const methodButtons = document.createElement('div');
        methodButtons.className = 'method-buttons';
        ['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
            const button = document.createElement('button');
            button.className = `method-button ${request.method === method ? 'active' : ''}`;
            button.innerText = method;
            button.onclick = () => {
                updateRequest(index, 'method', method);
                renderRequests();
                selectRequest(index);
            };
            methodButtons.appendChild(button);
        });

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'URL';
        urlInput.value = request.url;
        urlInput.onchange = (event) => updateRequest(index, 'url', event.target.value);

        const headersTextarea = document.createElement('textarea');
        headersTextarea.className = 'headers-textarea';  // Adiciona a classe
        headersTextarea.placeholder = 'Headers (key: value)';
        headersTextarea.value = request.headers;
        headersTextarea.onchange = (event) => updateRequest(index, 'headers', event.target.value);

        const bodyTextarea = document.createElement('textarea');
        bodyTextarea.placeholder = 'Body (JSON format)';
        bodyTextarea.value = request.body;
        bodyTextarea.style.height = '150px';
        bodyTextarea.onchange = (event) => updateRequest(index, 'body', event.target.value);

        const sendButton = document.createElement('button');
        sendButton.innerText = 'Send';
        sendButton.onclick = () => sendRequest(index);

        const responseDiv = document.createElement('div');
        responseDiv.className = 'response-container';
        responseDiv.id = `response-${index}`;

        const copyIcon = document.createElement('span');
        copyIcon.className = 'copy-icon';
        copyIcon.innerHTML = '<i class="fas fa-copy"></i>';
        copyIcon.style.display = request.response.trim() ? 'block' : 'none';
        copyIcon.onclick = () => {
            navigator.clipboard.writeText(request.response)
                .then(() => alert('Response copied to clipboard!'))
                .catch(err => alert('Failed to copy response: ', err));
        };

        const responseContent = document.createElement('div');
        responseContent.className = 'response';
        responseContent.innerText = request.response;

        responseDiv.appendChild(copyIcon);
        responseDiv.appendChild(responseContent);

        requestElement.appendChild(removeButton);
        requestElement.appendChild(reloadButton);
        requestElement.appendChild(requestName);
        requestElement.appendChild(methodButtons);
        requestElement.appendChild(urlInput);
        requestElement.appendChild(headersTextarea);
        requestElement.appendChild(bodyTextarea);
        requestElement.appendChild(sendButton);
        requestElement.appendChild(responseDiv);

        bodyTextarea.style.display = ['POST', 'PUT'].includes(request.method) ? 'block' : 'none';

        container.appendChild(requestElement);
    });
}

function updateRequestSelector() {
    const selector = document.getElementById('request-selector');
    selector.innerHTML = '';
    requests.forEach((request, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.innerText = request.name;
        selector.appendChild(option);
    });
    if (requests.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.innerText = 'No requests available';
        selector.appendChild(defaultOption);
    }
}

function selectRequest(index) {
    const requestElements = document.querySelectorAll('.request');
    requestElements.forEach((element, i) => {
        if (i === parseInt(index, 10)) {
            element.classList.add('active');
            document.getElementById('request-selector').value = index;
        } else {
            element.classList.remove('active');
        }
    });
    saveSelectedIndex(index);
}

document.getElementById('request-selector').addEventListener('change', (event) => {
    const index = parseInt(event.target.value, 10);
    selectRequest(index);
});

if (requests.length === 0) {
    addRequest();
} else {
    updateRequestSelector();
    renderRequests();
    selectRequest(selectedIndex);
}
