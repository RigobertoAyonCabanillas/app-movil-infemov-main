// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_chunky_thor.sql';
import m0001 from './0001_wonderful_jocasta.sql';
import m0002 from './0002_happy_nova.sql';
import m0003 from './0003_tired_shriek.sql';
import m0004 from './0004_outstanding_praxagora.sql';
import m0005 from './0005_milky_tomorrow_man.sql';
import m0006 from './0006_damp_victor_mancha.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  