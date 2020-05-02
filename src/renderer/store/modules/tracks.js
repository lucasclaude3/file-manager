import { ipcRenderer } from 'electron';

const state = {
  tracks: [],
  currentTrack: null,
  playlist: [],
};

const mutations = {
  LOAD_TRACKS(state, payload) {
    state.tracks = payload.tracks || [];
  },
  ADD_TRACKS(state, payload) {
    state.tracks = state.tracks.concat(payload.tracks);
  },
  UPDATE_TRACK(state, payload) {
    state.tracks = state.tracks.filter(t => t.id !== payload.track.id);
    state.tracks.push(payload.track);
  },
  LAUNCH_TRACK(state, payload) {
    state.currentTrack = payload.track;
    state.playlist.push(payload.track);
  },
  UPDATE_CURRENT_TRACK(state, payload) {
    state.currentTrack = payload.currentTrack;
  },
};

const actions = {
  loadTracks({ commit }, tagId) {
    ipcRenderer.send('tracks:load', tagId);
    ipcRenderer.on('tracks:loaded', (event, tracks) => {
      commit({ type: 'LOAD_TRACKS', tracks });
      ipcRenderer.removeAllListeners('tracks:loaded');
    });
  },

  loadAllTracks({ commit }, withoutTags) {
    ipcRenderer.send('tracks:load');
    ipcRenderer.on('tracks:loaded', (event, tracks) => {
      const tracksToLoad = withoutTags ? tracks.filter(t => t.tagBag.length === 0) : tracks;
      commit({ type: 'LOAD_TRACKS', tracks: tracksToLoad });
      ipcRenderer.removeAllListeners('tracks:loaded');
    });
  },

  addTagToTracks({ commit }, { tagId, trackIds }) {
    ipcRenderer.send('tracks:addTag', { tagId, trackIds });
    ipcRenderer.on('track:tagAdded', (event, track) => {
      commit({ type: 'UPDATE_TRACK', track });
      ipcRenderer.removeAllListeners('track:tagAdded');
    });
  },

  watchTrackAddition({ commit }) {
    ipcRenderer.on('tracks:added', (event, tracks) => {
      commit({ type: 'ADD_TRACKS', tracks });
      ipcRenderer.removeAllListeners('tracks:added');
    });
  },

  watchTrackModification({ commit, state }) {
    ipcRenderer.on('track:updated', (event, track) => {
      commit({ type: 'UPDATE_TRACK', track });
      if (state.currentTrack && state.currentTrack.id === track.id) {
        commit({ type: 'UPDATE_CURRENT_TRACK', currentTrack: track });
      }
    });
  },

  launchTrack({ commit }, track) {
    commit({ type: 'LAUNCH_TRACK', track });
  },

  searchTrack({ commit }, { searchTerms, tag }) {
    ipcRenderer.send('track:search', { searchTerms, tag });
    ipcRenderer.on('tracks:loaded', (event, tracks) => {
      const tracksToLoad = tag ? tracks.filter(t => t.tagBag.indexOf(tag.id) > -1) : tracks;
      commit({ type: 'LOAD_TRACKS', tracks: tracksToLoad });
      ipcRenderer.removeAllListeners('tracks:loaded');
    });
  },
};

export default {
  state,
  mutations,
  actions,
  namespaced: true,
};
