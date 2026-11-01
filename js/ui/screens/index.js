// The nine screens, in navigation order.
import overview from './overview.js';
import diagnosis from './diagnosis.js';
import claims from './claims.js';
import strategy from './strategy.js';
import plantX from './plantx.js';
import plan from './plan.js';
import cash from './cash.js';
import roadmap from './roadmap.js';
import data from './data.js';

export const SCREENS = [overview, diagnosis, claims, strategy, plantX, plan, cash, roadmap, data];

export const screenById = (id) => SCREENS.find((s) => s.id === id);
