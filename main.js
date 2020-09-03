window.onload = () => {
    this.user = {};
    let userData;
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
    // === STRONA POWITALNA === //
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
    // === REGISTRATION PANEL === //
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
    // === LOGIN PANEL === //
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
    // === SIDEBAR === //
    const sidebarTemplate = `<div class="sidebar collapsed">
        <ul class="nav" id="nav">
            <li id="add-food" class="active"><span>Dodaj Potrawe</span><span>DP</span></li>
            <li id="edit-profile"><span>Edytuj Profil</span><span>EP</span></li>
            <li id="edit-colors"><span>Zmien Kolor</span><span>ZK</span></li>
        </ul>
        <span id="collapse-btn"><</span>
    </div>`;
    // === SIDEBAR -> USER PANEL === //
    const userPanelTemplate = (data) => `<div class="user-panel">
        <img src="./assets/images/pexels-chloe-kala-1043471.jpg" alt="user image"/>
        <p class="name">${data.name}</p>
        <p class="surname">${data.surname}</p>
        <p class="email">${data.email}</p>
    </div>`;
    // === PRAWA CZĘŚĆ STRONY PO ZALOGOWANIU === //
    const panelTemplate = `<section id="panel">
        <div id="container"></div>
        <button id="logout">Wyloguj się</button>
    </section>`;
    // === STRONA Z USTAWIENIAMI KOLORÓW === //
    const colorSettingsTemplate = (data) => `
        <div id="color-settings-page">
            <div class="colors-box">
                <span class="background-main"></span>
                <span class="main-color"></span>
                <span class="background-secondary"></span>
                <span class="font-color"></span>
            </div>
            <h1>Ustawienia kolorów</h1>
            <form id="colors-settings">
                <label>
                    <b>Tło</b>
                    <input class="background-main" type="text" placeholder="${data.theme['background-main']}" name="backgroundMain"/>
                </label>
                <label>
                    <b>Kolor nawigacji</b>
                    <input class="main-color" name="mainColor" type="text" placeholder="${data.theme['main-color']}"/>
                </label>
                <label>
                    <b>Tło (Dodatkowy)</b>
                    <input class="background-secondary" type="text" placeholder="${data.theme['background-secondary']}" name="backgroundSecondary"/>
                </label>
                <label>
                    <b>Kolor czcionki</b>
                    <input class="font-color" name="fontColor" type="text" placeholder="${data.theme['font-color']}"/>
                </label>
                <button type="submit">Zapisz kolory</button>
            </form>
        </div>
    `;

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
                                    this.user = {...userData.data(), id: resp.user.uid};
                                    userData = {...userData.data(), id: resp.user.uid};
                                    // nadajemy kolory zdefiniowanym zmiennym w style.less
                                    less.modifyVars({
                                        /* @main-color */ 'main-color': this.user.theme['main-color'],
                                        /* @background */ 'background': this.user.theme['background-main'],
                                        /* @font-color */ 'font-color': this.user.theme['font-color'],
                                        /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
                                    });
                                    // Budujemy template z eventListenerem dla przycisku Logout
                                    buildTemplate(panelTemplate, main, false, true, 'logout');
                                    // Budujemy template sidebar
                                    buildTemplate(sidebarTemplate, document.getElementById('panel'), true);
                                    createListener('edit-colors');
                                    // Usuwamy welcome page
                                    document.getElementById('welcome-page').remove();
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
                    document.getElementById('panel').remove();
                    // Resetujemy dane globalnej "user"
                    this.user = {};
                    buildTemplate(wellcomeTemplate, main);
                    buildTemplate(registrationPageTemplate, document.getElementById('registration-container'), false, true, 'registration');
                    buildTemplate(loginPageTemplate, document.getElementById('login-container'), false, true, 'login');
                }, true);
            // Sidebar toggle listener
            case 'collapse-sidebar':
                return document.getElementById('collapse-btn').addEventListener('click', e => document.querySelector('.sidebar').classList.toggle('collapsed'), true);
            case 'edit-colors':
                return document.getElementById(id).addEventListener('click', e => {
                    document.getElementById('container').innerHTML = '';
                    document.getElementById('nav').querySelectorAll('li').forEach((el) => {
                        if (el.classList.contains('active') && !document.isEqualNode(el, e.target)) {
                            el.classList.remove('active');
                        }
                        e.target.classList.add('active');
                    })
                    buildTemplate(colorSettingsTemplate(this.user), document.getElementById('container'), true, true, 'colors-settings');
                });
            case 'colors-settings':
                return document.getElementById('colors-settings').addEventListener('submit', e => {
                    e.preventDefault();
                    const {backgroundMain, backgroundSecondary, mainColor, fontColor} = e.target.elements;
                    firestore.collection('users').doc(this.user.id).update({
                        ...this.user,
                        'theme': {
                            'background-main': backgroundMain.value || backgroundMain.placeholder,
                            'background-secondary': backgroundSecondary.value || backgroundSecondary.placeholder,
                            'main-color': mainColor.value || mainColor.placeholder,
                            'font-color': fontColor.value || fontColor.placeholder
                        }
                    }).then(resp => {
                        firestore.collection('users').doc(this.user.id).get().then(userData => {
                            if (userData.exists) {
                                this.user = {...userData.data()};
                                // nadajemy kolory zdefiniowanym zmiennym w style.less
                                less.modifyVars({
                                    /* @main-color */ 'main-color': this.user.theme['main-color'],
                                    /* @background */ 'background': this.user.theme['background-main'],
                                    /* @font-color */ 'font-color': this.user.theme['font-color'],
                                    /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
                                });
                            } else {
                                errorMsg = 'Ten użytkownik nie istnieje, prosze spróbować ponownie';
                            }
                        })
                    }).catch(err => alert(err));
                });
            default: return false;

        }
    };
    // Funkcja do budowania templatów
    const buildTemplate = (template, place, beforePlacement, listener, id) => {
        if (beforePlacement) {
            place.insertAdjacentHTML('afterbegin', template);
        } else {
            place.insertAdjacentHTML('beforeend', template);
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