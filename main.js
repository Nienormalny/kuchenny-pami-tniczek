window.onload = () => {
    const localStorage = window.localStorage;
    this.user = JSON.parse(localStorage.getItem('userData')) || {};
    this.publicRecipes = [];
    console.log('__HELLO___FIRIEND__', this.user);
    // Funkcje firebasowe jako stałe
    const firestore = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const profileImages = storageRef.child('images/profiles');
    const recipesImages = storageRef.child('images/recipes');

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
    const imageOptions = {
        maxHeight: 400,
        maxWidth: 400,
        image: null
    }

    // Stałe / Zmienne
    let errorMsg = '';
    let ingredientsList = [];
    let numberOfIngredients = 0;

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
            <button type="submit">Zarejestruj się</button>
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
            <button type="submit">Zaloguj się</button>
        </form>
    </div>`;
    // === SIDEBAR === //
    const sidebarTemplate = `<div class="sidebar collapsed">
        <ul class="nav" id="nav">
            <li id="food-recipes"><span>Moje Potrawy</span><span>DP</span></li>
            <li id="edit-profile"><span>Edytuj Profil</span><span>EP</span></li>
            <li id="edit-colors"><span>Zmien Kolor</span><span>ZK</span></li>
        </ul>
        <div id="collapse-btn">
            <span><</span>
            <div class="mobile">
                <span class="line-1"></span>
                <span class="line-2"></span>
                <span class="line-3"></span>
            </div>
        </div>
    </div>`;
    // === SIDEBAR -> USER PANEL === //
    const userPanelTemplate = (data) => `<div class="user-panel">
        <img class="user-image" src="${data.image || './assets/standard-user-image.png'}" alt="user image"/>
        <p class="name">${data.name}</p>
        <p class="surname">${data.surname}</p>
        <p class="email">${data.email}</p>
    </div>`;
    // === PRAWA CZĘŚĆ STRONY PO ZALOGOWANIU === //
    const panelTemplate = (data) => `<section id="panel">
        <div id="container">
            <div class="logged-info">
                <h1>Witaj ${data.name}!</h1>
                <h2>Co dzisiaj jemy?</h2>
            </div>
        </div>
        <button id="logout">Wyloguj się</button>
    </section>`;
    // === STRONA Z PRZEPISAMI === //
    const foodRecipesTemplate = (data) => `
        <div id="food-recipes-page">
            ${checkIfRecipesExists(data)}
            <button id="add-food"></button>
        </div>
    `;
    const getIngredients = (ingredients) => {
        return ingredients.map(ing => {
            return `<li>${ing}</li>`;
        }).join('');
    }

    // === MODAL DO DODAWANIA PRZEPISU === //
    const addRecipeModalTemplate = `
        <div id="add-recipe-modal">
            <h2>Dodaj przepis</h2>
            <form id="add-recipe">
                <label>
                    <b>Nazwa potrawy</b>
                    <input type="text" placeholder="Nazwa potrawy" name="recipeName"/>
                </label>
                <label>
                    <b>Publiczny</b>
                    <input name="public" type="checkbox"/>
                </label>
                <label>
                    <b>Link do zdjęcia</b>
                    <input name="imageFile" type="file" id="upload-recipe-image"/>
                    <div id="preview"></div>
                </label>
                <label id="ingredients">
                    <b>Składniki</b>
                    <input id="ingredient" type="text" placeholder="np. 200g Mąki..." name="ingredient"/>
                    <button id="add-ingredient"></button>
                    <ul id="ingredients-list"></ul>
                </label>
                <label>
                    <b>Opis</b>
                    <textarea name="description" type="text" placeholder="Na początku dodaj 200g mąki do miski..." ></textarea>
                </label>
                <button type="submit">Dodaj</button>
            </form>
            <button id="close-recipe-modal"></button>
        </div>
    `;
    const ingredientLiTemplate = (ingredient, id) => `<li id="${id}">${ingredient} <button data-id="${id}" class="remove-ingredient"></button></li>`;
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
    // === STRONA Z USTAWIENIAMI KOLORÓW === //
    const profileSettingsTemplate = (data) => `
        <div id="profile-settings-page">
            <div class="profile-box">
                <img class="user-image" src="${data.image || './assets/standard-user-image.png'}" alt="Zdjęcie profilu"/>
            </div>
            <h1>Ustawienia profilu</h1>
            <form id="profile-settings">
                <label>
                    <b>Imie</b>
                    <input type="text" placeholder="${data.name}" name="name"/>
                </label>
                <label>
                    <b>Nazwisko</b>
                    <input name="surname" type="text" placeholder="${data.surname}"/>
                </label>
                <label>
                    <b>Dodaj fote</b>
                    <input name="imageFile" id="upload-avatar" type="file"/>
                    <div id="preview"></div>
                </label>
                <label>
                    <b>Kolor ramki zdjęcia</b>
                    <input class="border-image-color" name="borderColor" type="text" placeholder="${data['border-color']}"/>
                </label>
                <button type="submit">Zapisz ustawienia</button>
            </form>
        </div>
    `;
    const dailyRecipeTemplate = (recipeData) => `
        <div id="daily-recipe">
            <h1>Danie dnia</h1>
            <img src="${recipeData.imageUrl}" alt="${recipeData.name}"/>
            <div class="recipe-details">
                <h2>${recipeData.name}</h2>
                <h3>Składniki</h3>
                <ul class="recipe-ingredients">
                    ${getIngredients(recipeData.ingredients)}
                </ul>
                <p>
                    ${recipeData.description}
                </p>
            </div>
        </div>
    `;

    const checkIfRecipesExists = (data) => {
        if (data.recipes) {
            return Array.from(data.recipes).map(recipe => {
                return `
                    <div class="recipe-box">
                        <div class="box-header">
                            <h3>${recipe.name}${recipe.public ? ' (publiczny)' : ''}</h3>
                            <button class="delete">Usuń</button>
                        </div>
                        <div class="recipe-details">
                            <ul>
                                ${getIngredients(recipe.ingredients)}
                            </ul>
                            <p class="recipe-description">
                                ${recipe.description}
                            </p>
                        </div>
                        <img src="${recipe.imageUrl}"/>
                    </div>
                `;
            }).join('');
        } else {
            return `<h1>Nie ma food</h1>`;
        }
    }

    const loggedIn = () => {
        // nadajemy kolory zdefiniowanym zmiennym w style.less
        less.modifyVars({
            /* @main-color */ 'main-color': this.user.theme['main-color'],
            /* @background */ 'background': this.user.theme['background-main'],
            /* @font-color */ 'font-color': this.user.theme['font-color'],
            /* @border-color */ 'border-color': this.user['border-color'],
            /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
        });
        // Budujemy template z eventListenerem dla przycisku Logout
        buildTemplate(panelTemplate(this.user), main, false, true, 'logout');
        // Budujemy template sidebar
        buildTemplate(sidebarTemplate, document.getElementById('panel'), true);
        createListener('edit-colors');
        createListener('food-recipes');
        createListener('edit-profile');
        if (document.getElementById('welcome-page')) {
            document.getElementById('welcome-page').remove();
        }
        // Budujemy podgląd usera w sidebarze z eventListenerem dla Przycisku powiększającego sidebar
        buildTemplate(userPanelTemplate(this.user), document.querySelector('.sidebar'), true, true, 'collapse-sidebar');
        getRecipes().then(() => {
            localStorage.setItem('userData', JSON.stringify(this.user));
            //TODO: Dodaj info o dodaniu nowego przepisu
        });
    }

    const getRecipes = async () => {
        return firestore.collection('users').doc(this.user.id).collection('recipes').get().then(resp => {
            this.user.recipes = [];
            resp.forEach(doc => this.user = {...this.user, 'recipes': [...this.user.recipes, {...doc.data()}]});
        });
    }
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
                                    this.user = {...userData.data(), id: resp.user.uid, loggedInAt: new Date()};
                                    localStorage.setItem('userData', JSON.stringify(this.user));
                                    loggedIn();
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
                    localStorage.removeItem('userData');
                    buildTemplate(wellcomeTemplate, main);
                    buildTemplate(registrationPageTemplate, document.getElementById('registration-container'), false, true, 'registration');
                    buildTemplate(loginPageTemplate, document.getElementById('login-container'), false, true, 'login');
                }, true);
            // Sidebar toggle listener
            case 'collapse-sidebar':
                return document.getElementById('collapse-btn').addEventListener('click', e => {
                    if (window.innerWidth < 769 && document.querySelector('.sidebar').classList.contains('collapsed')) {
                        document.getElementById('nav').addEventListener('click', (el) => {
                            document.querySelector('.sidebar').classList.add('collapsed');
                        });
                    }
                    document.querySelector('.sidebar').classList.toggle('collapsed');
                }, true);
                case 'food-recipes':
                    return document.getElementById(id).addEventListener('click', e => {
                        document.getElementById('container').innerHTML = '';
                        document.getElementById('nav').querySelectorAll('li').forEach((el) => {
                        if (el.classList.contains('active') && !document.isEqualNode(el, e.target)) {
                            el.classList.remove('active');
                        }
                        e.target.classList.add('active');
                    })
                    buildTemplate(foodRecipesTemplate(this.user), document.getElementById('container'), true, true, 'add-food');
                });
            case 'add-food':
                return document.getElementById(id).addEventListener('click', e => {
                    e.preventDefault();
                    buildTemplate(addRecipeModalTemplate, document.getElementById('container'), true, true, 'add-recipe');
                    createListener('close-recipe-modal');
                });
            case 'close-recipe-modal':
                return document.getElementById(id).addEventListener('click', e => {
                    e.preventDefault();
                    document.getElementById('add-recipe-modal').remove();
                })
            case 'add-recipe':
                createListener('add-ingredient');
                document.getElementById('upload-recipe-image').addEventListener('change', (e) => {
                    processFile(e.target.files[0], 'add-recipe');
                });
                return document.getElementById(id).addEventListener('submit', e => {
                    e.preventDefault();
                    const {recipeName, imageUrl, description, public} = e.target.elements;
                    const recipeId = create_UUID();
                    if (recipeName.value && description.value && ingredientsList.length && imageOptions.image) {
                        recipesImages.child(`${this.user.id}-recipe-images/${recipeId}`).put(imageOptions.image).then(el => {
                            storageRef.child(el.metadata.fullPath).getDownloadURL().then(url => {
                                firestore.collection('users').doc(this.user.id).collection('recipes').doc(recipeId).set({
                                    'id': recipeId,
                                    'createdAt': new Date(),
                                    'name': recipeName.value,
                                    'imageUrl': url,
                                    'description': description.value,
                                    'ingredients': ingredientsList,
                                    'public': public.checked
                                }).then(reps => {
                                    firestore.collection('users').doc(this.user.id).get().then(userData => {
                                        this.user = {...userData.data()};
                                        getRecipes().then(() => {
                                            localStorage.setItem('userData', JSON.stringify(this.user));
                                            ingredientsList = [];
                                            //TODO: Dodaj info o dodaniu nowego przepisu
                                            document.getElementById('container').innerHTML = '';
                                            buildTemplate(foodRecipesTemplate(this.user), document.getElementById('container'), true, true, 'add-food');
                                        });
                                    });
                                });
                            });
                        });
                    } else {
                        if (!recipeName.value || !ingredientsList.length) {
                            recipeName.parentElement.classList.add('error');
                        }
                        if (!ingredientsList.length) {
                            document.getElementById('ingredients').classList.add('error');
                        }
                        if (!description.value) {
                            description.parentElement.classList.add('error');
                        }
                        if (!imageOptions.image) {
                            document.getElementById('upload-recipe-image').parentElement.classList.add('error');
                        }
                        buildTemplate(`<p class="error-msg">Prosze wypełnić pola zaznaczone na czerwono!</p>`, document.getElementById('add-recipe'), true);
                    }
                });
            case 'add-ingredient':
                createListener('remove-ingredient');
                return document.getElementById(id).addEventListener('click', e => {
                    const inputValue = document.getElementById('ingredient').value;
                    e.preventDefault();
                    if (inputValue) {
                        numberOfIngredients++;
                        ingredientsList.push(inputValue.replace(' ', '-'));
                        buildTemplate(ingredientLiTemplate(inputValue, `ingredient-${numberOfIngredients}`), document.getElementById('ingredients-list'));
                        document.getElementById('ingredient').value = '';
                    } else {
                        document.getElementById('ingredients').classList.add('error');
                    }
                });
            case 'remove-ingredient':
                return document.getElementById('ingredients-list').addEventListener('click', e => {
                    e.preventDefault();
                    const index = ingredientsList.indexOf();
                    ingredientsList = ingredientsList.filter(item => item !== e.target.parentElement.innerText.replace(' ', '-'));
                    console.dir(e.target);
                    if (e.target.localName === 'li') {
                        e.target.remove();
                    }
                    if (e.target.localName === 'button') {
                        e.target.parentElement.remove();
                    }
                });
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
            case 'edit-profile':
                return document.getElementById(id).addEventListener('click', e => {
                    document.getElementById('container').innerHTML = '';
                    document.getElementById('nav').querySelectorAll('li').forEach(el => {
                        if (el.classList.contains('active') && !document.isEqualNode(el, e.target)) {
                            el.classList.remove('active');
                        }
                        e.target.classList.add('active');
                    })
                    buildTemplate(profileSettingsTemplate(this.user), document.getElementById('container'), true, true, 'profile-settings-page');
                });
            case 'profile-settings-page':
                document.getElementById('upload-avatar').addEventListener('change', (e) => {
                    processFile(e.target.files[0], 'profile-settings');
                });
                let imageUrl = '';
                return document.getElementById(id).addEventListener('submit', e => {
                    e.preventDefault();
                    const {name, surname, borderColor} = e.target.elements;
                    if (imageOptions.image) {
                        profileImages.child(`${this.user.id}-avatar`).put(imageOptions.image).then(el => {
                            storageRef.child(el.metadata.fullPath).getDownloadURL().then(url => {
                                imageUrl = url;
                                firestore.collection('users').doc(this.user.id).update({
                                    'border-color': borderColor.value || borderColor.placeholder,
                                    'name': name.value || name.placeholder,
                                    'surname': surname.value || surname.placeholder,
                                    'image': url
                                }).then(resp => {
                                    firestore.collection('users').doc(this.user.id).get().then(userData => {
                                        if (userData.exists) {
                                            this.user = {...userData.data()};
                                            localStorage.setItem('userData', JSON.stringify(this.user));
                                            less.modifyVars({
                                                /* @main-color */ 'main-color': this.user.theme['main-color'],
                                                /* @background */ 'background': this.user.theme['background-main'],
                                                /* @font-color */ 'font-color': this.user.theme['font-color'],
                                                /* @border-color */ 'border-color': this.user['border-color'],
                                                /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
                                            });
                                            document.querySelector('.user-panel').remove();
                                            console.dir(document.querySelector('.profile-box'));
                                            document.querySelector('.profile-box').children[0].setAttribute('src', this.user.image);
            
                                            buildTemplate(userPanelTemplate(this.user), document.querySelector('.sidebar'), true);
                                            getRecipes().then(() => {
                                                localStorage.setItem('userData', JSON.stringify(this.user));
                                                //TODO: Dodaj info o dodaniu nowego przepisu
                                            });
                                        } else {
                                            errorMsg = 'Ten użytkownik nie istnieje, prosze spróbować ponownie';
                                        }
                                    });
                                });
                            });
                        });
                    } else {
                        firestore.collection('users').doc(this.user.id).update({
                            'border-color': borderColor.value || borderColor.placeholder,
                            'name': name.value || name.placeholder,
                            'surname': surname.value || surname.placeholder,
                            'image': imageUrl || this.user.image
                        }).then(resp => {
                            firestore.collection('users').doc(this.user.id).get().then(userData => {
                                if (userData.exists) {
                                    this.user = {...userData.data()};
                                    localStorage.setItem('userData', JSON.stringify(this.user));
                                    less.modifyVars({
                                        /* @main-color */ 'main-color': this.user.theme['main-color'],
                                        /* @background */ 'background': this.user.theme['background-main'],
                                        /* @font-color */ 'font-color': this.user.theme['font-color'],
                                        /* @border-color */ 'border-color': this.user['border-color'],
                                        /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
                                    });
                                    document.querySelector('.user-panel').remove();
                                    console.dir(document.querySelector('.profile-box'));
                                    document.querySelector('.profile-box').children[0].setAttribute('src', this.user.image);
    
                                    buildTemplate(userPanelTemplate(this.user), document.querySelector('.sidebar'), true);
                                    getRecipes().then(() => {
                                        localStorage.setItem('userData', JSON.stringify(this.user));
                                        //TODO: Dodaj info o dodaniu nowego przepisu
                                    });
                                } else {
                                    errorMsg = 'Ten użytkownik nie istnieje, prosze spróbować ponownie';
                                }
                            });
                        });
                    }
                })
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
                                getRecipes().then(() => {
                                    localStorage.setItem('userData', JSON.stringify(this.user));
                                    //TODO: Dodaj info o dodaniu nowego przepisu
                                });
                                less.modifyVars({
                                    /* @main-color */ 'main-color': this.user.theme['main-color'],
                                    /* @background */ 'background': this.user.theme['background-main'],
                                    /* @font-color */ 'font-color': this.user.theme['font-color'],
                                    /* @border-color */ 'border-color': this.user['border-color'],
                                    /* @background-secondary */ 'background-secondary': this.user.theme['background-secondary']
                                });
                            } else {
                                errorMsg = 'Ten użytkownik nie istnieje, prosze spróbować ponownie';
                            }
                        })
                    }).catch(err => alert(err));
                });
            case 'get-public-recipes':
                // Pobieramy wszystkie publiczne przepisy
                return firestore.collectionGroup('recipes').where('public', '==', true).get().then(recipes => {
                    recipes.forEach(doc => {
                        // Dodajemy je do globalnej tablicy
                        this.publicRecipes.push(doc.data());
                    });
                }).then(() => {
                    firestore.collection('dailyRecipes').get().then(respond => {
                        // Pobieramy losową receptę z wszystkich publicznych recept
                        const randomNumber = Math.floor(Math.random() * this.publicRecipes.length);
                        const date = new Date().toLocaleDateString();
                        // Sprawdza czy dailyRecipes kolekcja istnieje
                        if (respond.size) {
                            if (respond.docs[respond.docs.length - 1].data().createdAt !== new Date().toLocaleDateString()) {
                                firestore.collection('dailyRecipes').doc(date).set({
                                    'recipeData': this.publicRecipes[randomNumber],
                                    'createdAt': date,
                                    'auto': true
                                });
                                buildTemplate(dailyRecipeTemplate(this.publicRecipes[randomNumber]), document.getElementById('welcome-page'), true);
                            } else {
                                respond.forEach(doc => {
                                    if (doc.exists && doc.data().createdAt) {
                                        // Sprawdza czy data dokumentu jest równa dzisiejszemu dniu
                                        if (doc.data().createdAt === new Date().toLocaleDateString()) {
                                            buildTemplate(dailyRecipeTemplate(doc.data().recipeData), document.getElementById('welcome-page'), true);
                                        // Sprawdza czy ostatnia wartosc (ostatnia data) w dokumentach z kolekcji nie jest dniem dzisiejszym
                                        }
                                    }
                                });
                            }
                        // Jeśli nie istnieje to tworzy nową
                        } else {
                            firestore.collection('dailyRecipes').doc(date).set({
                                'recipeData': this.publicRecipes[randomNumber],
                                'createdAt': date,
                                'auto': true
                            });
                            buildTemplate(dailyRecipeTemplate(this.publicRecipes[randomNumber]), document.getElementById('welcome-page'), true);
                        }
                    }).catch(err => {
                        console.log('ERROR', err)
                    });
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
    const dataURItoBlob = (dataURI) => {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);
    
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    
        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
    
        return new Blob([ia], {type:mimeString});
    }
    const resizeMe = (img) => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > imageOptions.maxWidth) {
                height = Math.round(height *= imageOptions.maxWidth / width);
                width = imageOptions.maxWidth;
            }
        } else {
            if (height > imageOptions.maxHeight) {
                width = Math.round(width *= imageOptions.maxHeight / height);
                height = imageOptions.maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        document.getElementById('preview').appendChild(canvas);
        return canvas.toDataURL("image/jpeg", 0.7);
    }
    const processFile = (file, formId) => {
        if (!(/image/i).test(file.type)) {
            alert("Plik" + file.name + "nie jest zdjęciem.");
            return false;
        }
        const form = document.getElementById(formId);

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = event => {
            // Blob
            const blob = new Blob([event.target.result]); // Tworzymy blob
            window.URL = window.URL || window.webkitURL;
            const blobURL = window.URL.createObjectURL(blob); // Pobieramy link do bloba

            const image = new Image();
            image.src = blobURL;
            image.onload = () => {
                const resized = resizeMe(image);
                const newinput = document.createElement('input');
                newinput.type = 'hidden';
                newinput.name = 'avImage';
                newinput.value = resized;
                imageOptions.image = dataURItoBlob(resized);;
                form.appendChild(newinput);
            }
        }
    }

    if (Object.keys(this.user).length > 0) {
        loggedIn();
    } else {
        buildTemplate(wellcomeTemplate, main, true, true, 'get-public-recipes');
        buildTemplate(registrationPageTemplate, document.getElementById('registration-container'), false, true, 'registration');
        buildTemplate(loginPageTemplate, document.getElementById('login-container'), false, true, 'login');
    }
}