import isURL from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';
import axios from 'axios';
import $ from 'jquery';

const { watch } = WatchJS;

const app = () => {
  const state = {
    idCounter: 0,
    userInput: '',
    validity: false,
    feeds: [],
  };

  const inputField = document.querySelector('#user-input-field');
  const inputButton = document.querySelector('#user-input-button');
  const inputForm = document.querySelector('form');
  const modal = document.querySelector('#exampleModal');

  const proxy = 'https://cors-anywhere.herokuapp.com/';

  // При старте страницы очищаем поле ввода
  inputField.value = '';

  // isNewFeed - проверяем, отсутствует ли фид, который вводит пользователь в нашей базе данных
  const isNewFeed = (feedUrl) => {
    const result = state.feeds.filter(e => e.channelLink === feedUrl);
    if (result.length === 0) return true;
    return false;
  };

  inputField.addEventListener('input', (e) => {
    e.preventDefault();
    const { value } = e.target;
    state.userInput = value;
    state.validity = isURL(value) && isNewFeed(value);
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const proxiedUrl = `${proxy}${state.userInput}`;
    axios.get(proxiedUrl)
      .then((response) => {
        // Сохраняем ссылку
        const channelLink = state.userInput;

        // Возвращаем форму в исходное состояние
        state.userInput = '';
        state.validity = false;
        inputField.value = '';

        // Парсим RSS
        const parser = new DOMParser();
        const feedXml = parser.parseFromString(response.data, 'application/xml');

        // Получаем имя и описание канала
        const channelTitle = feedXml.querySelector('title').textContent;
        const channelDescription = feedXml.querySelector('description').textContent;

        // Получаем список статей
        const articlesXmlNodeList = feedXml.querySelectorAll('item');
        const articlesXmlArray = Array.from(articlesXmlNodeList);

        // Собираем массив, где каждый элемент - это статья из articles
        const channelArticles = articlesXmlArray.map((article) => {
          const articleName = article.querySelector('title').textContent;
          const articleDescription = article.querySelector('description').textContent;
          const articleLink = article.querySelector('link').textContent;
          // state.idCounter += 1;
          return {
            articleId: state.idCounter,
            articleName,
            articleDescription,
            articleLink,
          };
        });

        // Сохраняем фид в state.feeds
        state.feeds.push({
          channelId: state.idCounter,
          channelTitle,
          channelLink,
          channelDescription,
          channelArticles,
        });
        state.idCounter += 1;
        console.log('Added!');
      })
      .catch((error) => {
        console.log(error);
      });
  });

  // Рендер модального окна
  $('#exampleModal').on('show.bs.modal', (event) => {
    console.log('!HERE!');
    const button = $(event.relatedTarget);
    modal.querySelector('.modal-body').innerHTML = button.data('description');
  });

  // Если урл некорректный, то подсвечиваем поле ввода и выключаем кнопку
  watch(state, 'userInput', () => {
    if (state.validity) {
      inputField.classList.add('is-valid');
      inputField.classList.remove('is-invalid');
      inputButton.disabled = false;
    } else {
      inputField.classList.add('is-invalid');
      inputField.classList.remove('is-valid');
      inputButton.disabled = true;
    }
  });

  // Обновляем страницу при добавлении нового фида
  watch(state, 'idCounter', () => {
    const currentChanels = document.querySelector('.feeds-list');
    const currentArticles = document.querySelector('.articles-list');

    const newChanels = document.createElement('ul');
    const newArticles = document.createElement('ul');

    newChanels.classList.add('feeds-list', 'list-group');
    newArticles.classList.add('articles-list', 'list-group');

    state.feeds.forEach((feed) => {
      const chanelsListItem = document.createElement('li');
      chanelsListItem.classList.add('list-group-item');
      const chanelListItemContent = `<h4>${feed.channelTitle}</h4><p>${feed.channelDescription}</p>`;
      chanelsListItem.innerHTML = chanelListItemContent;
      newChanels.append(chanelsListItem);

      feed.channelArticles.forEach((article) => {
        const articlesListItem = document.createElement('li');
        articlesListItem.classList.add('list-group-item', 'py-2');

        const articleLink = document.createElement('a');
        articleLink.setAttribute('href', article.articleLink);
        articleLink.textContent = `${article.articleName}  `;

        const articleDescButton = document.createElement('button');
        articleDescButton.classList.add('btn', 'btn-secondary');
        articleDescButton.textContent = 'View';
        articleDescButton.setAttribute('type', 'button');
        articleDescButton.setAttribute('data-toggle', 'modal');
        articleDescButton.setAttribute('data-target', '#exampleModal');
        articleDescButton.setAttribute('data-description', article.articleDescription);

        articlesListItem.append(articleLink);
        articlesListItem.append(articleDescButton);

        newArticles.append(articlesListItem);
      });
    });
    currentChanels.replaceWith(newChanels);
    currentArticles.replaceWith(newArticles);
  });
};

export default app;
