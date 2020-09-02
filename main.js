window.onload = () => {
    this.user = {};
    console.log('__HELLO___FIRIEND__');
    // Funkcje firebasowe jako stałe
    const firestore = firebase.firestore();
    const auth = firebase.auth();

    // Odwołanie do elmentów w html
    const main = document.getElementById('main');

    // Dane do zapisania jako dane standardowe
    const borderColor = '#f94141';
    const theme = {
        'background-main': 'white',
        'background-secondary': '#d9d9d9',
        'main-color': '#41BCFF',
        'font-color': '#333333'
    }

    // Stałe / Zmienne
    let errorMsg = '';

    // TEMPLATKI
    const registrationPageTemplate = `<div id="registration-page">
        <h3>Rejestracja</h3>
        <form id="registration">
            <label>
                <b>Imię</b>
                <input type="text" placeholder="Imie" name="name"/>
            </label>
            <label>
                <b>Nazwisko</b>
                <input type="text" placeholder="Nazwisko" name="surname"/>
            </label>
            <label>
                <b>Email</b>
                <input name="email" type="email" placeholder="Twój email"/>
            </label>
            <label>
                <b>Hasło</b>
                <input name="password" type="password" placeholder="Twoje hasło"/>
            </label>
            <button type="submit">Zarejestrój się</button>
        </form>
    </div>
    `;
    const loginPageTemplate = `<div id="login-page">
        <h3>Login</h3>
        <form id="login">
            <label>
                <b>Email</b>
                <input name="email" type="email" placeholder="Twój email"/>
            </label>
            <label>
                <b>Hasło</b>
                <input name="password" type="password" placeholder="Twoje hasło"/>
            </label>
            <button type="submit">Zalogój się</button>
        </form>
    </div>`;
    const userPanelTemplate = (data) => `<div class="user-panel">
        <img src="./assets/images/pexels-chloe-kala-1043471.jpg" alt="user image"/>
        <p class="name">${data.name}</p>
        <p class="surname">${data.surname}</p>
        <p class="email">${data.email}</p>
    </div>`;
    const sidebarTemplate = `<div class="sidebar collapsed">
        <ul class="nav" id="nav">
            <li data-panel="add-food" class="active"><span>Dodaj Potrawe</span><span>DP</span></li>
            <li data-panel="edit-profile"><span>Edytuj Profil</span><span>EP</span></li>
            <li data-panel="edit-colors"><span>Zmien Kolor</span><span>ZK</span></li>
        </ul>
        <span id="collapse-btn"><</span>
    </div>`;
    const wellcomeTemplate = `<section id="welcome-page">
        <h1>Witaj w kuchennym pamiętniczku</h1>
        <div class="left-box">
            <h2>Nie posiadasz konta?</h2>
            <h3>Zarejestruj się</h3>
            <div id="registration-container"></div>
        </div>
        <div class="right-box">
            <h2>Posiadasz konto?</h2>
            <h3>Zaloguj się</h3>
            <div id="login-container"></div>
        </div>
    </section>`;
    const panelTemplate = `<section id="panel">
        <button id="logout">Wyloguj się</button>
    </section>`;

    // Funkcja do tworzenia listenerów
    const createListener = (id) => {
        switch (id) {
            // Firebase login listener
            case 'login':
                return document.getElementById('login').addEventListener('submit', e => {
                    e.preventDefault();
                    // Pobieramy elementy z <form></form>
                    const {email, password} = e.target.elements;
                    // Sprawdzamy czy inputy z name="email" i name="password" nie jest pusty
                    if (email.value && password.value) {
                        auth.signInWithEmailAndPassword(email.value, password.value).then(resp => {
                            /*
                                Wchodzimy do kolekcji forestore o nazwie "users".
                                Następnie wybieramy dokument z zalogowanym user id. | Za pomocą respond (po zalogowaniu) pobieramy id.
                                Za pomocą funkcji Firebasowej "get()", pobieramy dane dla konkretnego użytkownika.
                            */
                            firestore.collection('users').doc(resp.user.uid).get().then(userData => {
                                if (userData.exists) {
                                    this.user = {...userData.data()};
                                    // nadajemy kolory zdefiniowanym zmiennym w style.less
                                    less.modifyVars({
                                        /* @main-color */ 'main-color': this.user.theme['main-color'],
                                        /* @background */ 'background': this.user.theme['background-main'],
                                        /* @font-color */ 'font-color': this.user.theme['font-color']
                                    });
                                    // Budujemy template z eventListenerem dla przycisku Logout
                                    buildTemplate(panelTemplate, main, false, true, 'logout');
                                    // Budujemy template sidebar
                                    buildTemplate(sidebarTemplate, document.getElementById('panel'), true);
                                    // Usuwamy welcome page
                                    document.getElementById('welcome-page').parentElement.remove();
                                    // Budujemy podgląd usera w sidebarze z eventListenerem dla Przycisku powiększającego sidebar
                                    buildTemplate(userPanelTemplate(this.user), document.querySelector('.sidebar'), true, true, 'collapse-sidebar');
                                } else {
                                    errorMsg = 'Ten użytkownik nie istnieje, prosze spróbować ponownie';
                                }
                            })
                        }).catch(err => alert(err));
                    }
                }, true);
            // Firebase registration listener
            case 'registration':
                return document.getElementById('registration').addEventListener('submit', e => {
                    e.preventDefault();
                    // Podobna funkcja jak podczas logowania
                    const {email, password, name, surname} = e.target.elements;
                    // Podobna validacja jak przy logowaniu
                    if (email.value && password.value && name.value && surname.value) {
                        auth.createUserWithEmailAndPassword(email.value, password.value).then(resp => {
                            /*
                                Po zarejestrowaniu nowego użytkownika, tworzymy dla niego dokument
                                w kolekcji "users", dodając standardowe ustawienia
                                takie jak color/theme czy border/color oraz
                                imie i nazwisko.
                            */
                            firestore.collection('users').doc(resp.user.uid).set({
                                'name': name.value,
                                'surname': surname.value,
                                'email': email.value,
                                'border-color': borderColor,
                                'theme': theme,
                                'createdAt': new Date()
                            });
                        }).catch(err => {
                            alert(err);
                        });
                    }
                }, true);
            // Firebase logout listener
            case 'logout':
                return document.getElementById('logout').addEventListener('click', e => {
                    auth.signOut();
                    document.getElementById('panel').parentElement.remove();
                    // Resetujemy dane globalnej "user"
                    this.user = {};
                    buildTemplate(wellcomeTemplate, main);
                    buildTemplate(registrationPageTemplate, document.getElementById('registration-container'), false, true, 'registration');
                    buildTemplate(loginPageTemplate, document.getElementById('login-container'), false, true, 'login');
                }, true);
            // Sidebar toggle listener
            case 'collapse-sidebar':
                return document.getElementById('collapse-btn').addEventListener('click', e => document.querySelector('.sidebar').classList.toggle('collapsed'), true);
            default: return false;

        }
    };
    // Funkcja do budowania templatów
    const buildTemplate = (template, place, beforePlacement, listener, id) => {
        const fragment = document.createDocumentFragment();
        const element = document.createElement('div');
        element.innerHTML = template;
        fragment.appendChild(element);
        if (beforePlacement) {
            place.prepend(fragment);
        } else {
            place.appendChild(element);
        }
        if (listener) {
            createListener(id);
        }
    }

    // Wykorzystane zostanie do dodawania nowych przepisów.
    const create_UUID = () =>{
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    buildTemplate(wellcomeTemplate, main);
    buildTemplate(registrationPageTemplate, document.getElementById('registration-container'), false, true, 'registration');
    buildTemplate(loginPageTemplate, document.getElementById('login-container'), false, true, 'login');
}