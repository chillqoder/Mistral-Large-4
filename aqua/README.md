# Living Glass Aquarium

Откройте `index.html` двойным кликом. Сервер и интернет для запуска не нужны.
Файл `aquarium.bundle.js` должен находиться рядом с `index.html`.

После изменения исходных JS-файлов пересоберите готовый файл:

```sh
npm ci
npm run build
```

Для передачи готового проекта достаточно `index.html` и `aquarium.bundle.js`.
Three.js и OrbitControls включены в сборку; лицензия Three.js сохранена в ней.
