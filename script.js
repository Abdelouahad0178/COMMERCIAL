document.addEventListener('DOMContentLoaded', () => {
    const devisForm = document.getElementById('devis-form');
    const addArticleButton = document.getElementById('add-article');
    const articlesContainer = document.getElementById('articles-container');
    const clientsTableBody = document.getElementById('clients-table-body');
    const totalInput = document.getElementById('total');
    const printSection = document.getElementById('print-section');
    const printContent = document.getElementById('print-content');
    const { jsPDF } = window.jspdf;

    let devisList = JSON.parse(localStorage.getItem('devisList')) || [];



    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                }, err => {
                    console.log('Service Worker registration failed:', err);
                });
        });
    }
    










    devisForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const devisNumber = document.getElementById('devis-number').value;
        const clientName = document.getElementById('client-name').value;
        const date = document.getElementById('date').value;
        const total = totalInput.value;
        const articles = Array.from(articlesContainer.querySelectorAll('.article-row')).map(row => {
            return {
                description: row.querySelector('.description').value,
                quantity: row.querySelector('.quantity').value,
                price: row.querySelector('.price').value,
                total: row.querySelector('.article-total').value
            };
        });

        const devis = { devisNumber, clientName, date, total, articles };
        devisList.push(devis);
        localStorage.setItem('devisList', JSON.stringify(devisList));
        renderClientsTable();
        devisForm.reset();
        articlesContainer.innerHTML = '';
        totalInput.value = '';
    });

    addArticleButton.addEventListener('click', () => {
        const articleRow = document.createElement('div');
        articleRow.classList.add('article-row');
        articleRow.innerHTML = `
            <div class="form-group">
                <label for="description">Description</label>
                <input type="text" class="description" required>
            </div>
            <div class="form-group">
                <label for="quantity">Quantité</label>
                <input type="number" class="quantity" required>
            </div>
            <div class="form-group">
                <label for="price">Prix</label>
                <input type="number" class="price" required>
            </div>
            <div class="form-group">
                <label for="article-total">Total</label>
                <input type="text" class="article-total" readonly>
            </div>
        `;
        articlesContainer.appendChild(articleRow);

        articleRow.querySelector('.quantity').addEventListener('input', updateArticleTotal);
        articleRow.querySelector('.price').addEventListener('input', updateArticleTotal);
    });

    function updateArticleTotal() {
        const articleRow = this.closest('.article-row');
        const quantity = parseFloat(articleRow.querySelector('.quantity').value) || 0;
        const price = parseFloat(articleRow.querySelector('.price').value) || 0;
        const total = quantity * price;
        articleRow.querySelector('.article-total').value = total.toFixed(2);
        updateTotal();
    }

    function updateTotal() {
        let total = 0;
        articlesContainer.querySelectorAll('.article-row').forEach(row => {
            const articleTotal = parseFloat(row.querySelector('.article-total').value) || 0;
            total += articleTotal;
        });
        totalInput.value = total.toFixed(2);
    }

    function renderClientsTable() {
        clientsTableBody.innerHTML = '';
        devisList.forEach((devis, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${devis.clientName}</td>
                <td>${devis.devisNumber}</td>
                <td>${devis.date}</td>
                <td>${devis.total}</td>
                <td>
                    <button class="btn btn-warning" onclick="editDevis(${index})">Modifier</button>
                    <button class="btn btn-danger" onclick="deleteDevis(${index})">Supprimer</button>
                    <button class="btn btn-info" onclick="printDevis(${index})">Imprimer</button>
                </td>
            `;
            clientsTableBody.appendChild(row);
        });
    }

    window.editDevis = function(index) {
        const devis = devisList[index];
        document.getElementById('devis-number').value = devis.devisNumber;
        document.getElementById('client-name').value = devis.clientName;
        document.getElementById('date').value = devis.date;
        totalInput.value = devis.total;
        articlesContainer.innerHTML = '';
        devis.articles.forEach(article => {
            const articleRow = document.createElement('div');
            articleRow.classList.add('article-row');
            articleRow.innerHTML = `
                <div class="form-group">
                    <label for="description">Description</label>
                    <input type="text" class="description" value="${article.description}" required>
                </div>
                <div class="form-group">
                    <label for="quantity">Quantité</label>
                    <input type="number" class="quantity" value="${article.quantity}" required>
                </div>
                <div class="form-group">
                    <label for="price">Prix</label>
                    <input type="number" class="price" value="${article.price}" required>
                </div>
                <div class="form-group">
                    <label for="article-total">Total</label>
                    <input type="text" class="article-total" value="${article.total}" readonly>
                </div>
            `;
            articlesContainer.appendChild(articleRow);

            articleRow.querySelector('.quantity').addEventListener('input', updateArticleTotal);
            articleRow.querySelector('.price').addEventListener('input', updateArticleTotal);
        });
        devisList.splice(index, 1);
    };

    window.deleteDevis = function(index) {
        devisList.splice(index, 1);
        localStorage.setItem('devisList', JSON.stringify(devisList));
        renderClientsTable();
    };

    window.printDevis = function(index) {
        const devis = devisList[index];
        const doc = new jsPDF();

        let y = 10;

        doc.setFontSize(22);
        doc.text('MAISON CARRELAGE', 20, y);
        y += 10;
        doc.setFontSize(10);
        doc.text('CARRELAGE - ROBINETTERIE SALLE DE BAIN  MARBRE  99 Angle El Farabi & Rue Taza Tassila, Agadir', 20, y);
        y += 20;

        doc.setFontSize(18);
        doc.text(`Devis N° ${devis.devisNumber}`, 20, y);
        y += 10;
        doc.setFontSize(14);
        doc.text(`Client: ${devis.clientName}`, 20, y);
        y += 10;
        doc.text(`Date: ${devis.date}`, 20, y);
        y += 10;

        doc.autoTable({
            startY: y,
            head: [['Description', 'Quantité', 'Prix', 'Total']],
            body: devis.articles.map(article => [
                article.description,
                article.quantity,
                article.price,
                article.total
            ]),
            theme: 'grid'
        });

        y = doc.autoTable.previous.finalY + 10;
        doc.text(`Total: ${devis.total}`, 20, y);

        doc.save(`devis_${devis.devisNumber}.pdf`);
    };

    renderClientsTable();
});
