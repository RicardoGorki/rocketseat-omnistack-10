const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const api = require('../services/api');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();

    return res.json(devs);
  },

  async store(req, res) {
    const { github_username, techs, latitude, longitude } = req.body;

    const devExists = await Dev.findOne({ github_username });

    if (devExists) {
      return res.status(401).json({ error: 'Dev already exists.' });
    }

    const response = await api.get(`${github_username}`);

    const { name, avatar_url, bio } = response.data;

    const techsArray = parseStringAsArray(techs);

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    await Dev.create({
      github_username,
      name,
      bio,
      techs: techsArray,
      avatar_url,
      location,
    });

    const sendSocketMessageTo = findConnections(
      {
        latitude,
        longitude,
      },
      techsArray
    );
    sendMessage(sendSocketMessageTo, 'new-dev', { github_username });

    return res.json({
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location,
    });
  },

  async update(req, res) {
    const { id } = req.params;

    const { name, techs, bio, latitude, longitude } = req.body;

    const devExists = await Dev.findById(id);

    if (!devExists) {
      return res.status(400).json({ error: 'Dev does not exists.' });
    }

    const techsArray = parseStringAsArray(techs);

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    await devExists.update(req.body);

    return res.json({
      name,
      techs: techsArray,
      bio,
      location,
    });
  },

  async destroy(req, res) {
    const { id } = req.params;

    const devExists = await Dev.findById(id);

    if (!devExists) {
      return res.status(400).json({ error: 'Dev does not exists.' });
    }

    await Dev.findByIdAndDelete(id);

    return res.send({ ok: 'Dev deleted.' });
  },
};
