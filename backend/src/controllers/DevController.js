const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const api = require('../services/api');

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

    await Dev.create(req.body);

    return res.json({
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location,
    });
  },
};
