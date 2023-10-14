import React from 'react';

import { getHistoryRecord } from './core';

import './App.scss';

const App: React.FC = () => {
    const initHistoryRecord = async () => {
        const historyRecord = await getHistoryRecord();
        console.log('browserHistroy:', historyRecord);
    };
    return (
        <div className="app">
            <h1 className="title">popup page</h1>
            <button onClick={initHistoryRecord}>History</button>
        </div>
    );
};

export default App;
