# attentionflow-extension

## Description

This Chrome Extension is designed to detect and track users' `browsing history` and `bookmark changes` on a daily basis, from UTC 0:00 to the next day's UTC 0:00. It provides detailed information about the user's browsing activities and bookmark updates.

## Features

The extension offers the following features:

1. Browsing History Tracking:

   - Tracks the number of visits to a specific webpage URL.
   - Records the duration of time spent on each webpage.
   - Categorizes websites based on predefined categories.
   - Stores the timestamp of the last visit to each webpage.

2. Bookmark Tracking:

   - Captures bookmark information, including the title and folder location.
   - Categorizes websites based on predefined categories.
   - Stores the timestamp of when each bookmark was added.

3. Data Storage:

   - All tracked information is stored in the `chrome.storage` API.
   - Data is saved on a daily basis, from UTC 0:00 to the next day's UTC 0:00.
   - Historical data can be accessed and retrieved from the storage.

4. External Web Access:
   - The extension injects methods into the webpage's context using `content.js` .
   - These methods can be accessed by external web applications to retrieve the tracked information.

## Usage

To use the extension, follow these steps:

1. Install the Chrome Extension from the Chrome Web Store.
2. Once installed, the extension will automatically start tracking your browsing history and bookmark changes.
3. Access the tracked information by using the `window.attentionflow.getAttentionRecord` method from an external web application.
4. Call the `getAttentionRecord` method to retrieve the desired information, such as visit counts, duration, categorization, and timestamps, for further analysis or display.

## License

This project is licensed under the [MIT License](LICENSE).

## Contributions

Contributions to the Chrome Extension - Browse History Tracker are welcome! If you have any suggestions, bug reports, or feature requests, please submit them to the [attentionflow extension issues](https://github.com/AttentionFlow/attentionflow-extension/issues).
