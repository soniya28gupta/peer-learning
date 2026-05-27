import User from "../models/User.js";

// 📚 Calculate compatibility score
const calculateCompatibilityScore = (currentUser, otherUser) => {
  let score = 0;

  // Skills Match
  const commonSkills = currentUser.skills.filter((skill) =>
    otherUser.skills.includes(skill)
  );

  score += commonSkills.length * 10;

  // Interests Match
  const commonInterests = currentUser.interests.filter((interest) =>
    otherUser.interests.includes(interest)
  );

  score += commonInterests.length * 10;

  // Learning Goals Match
  const commonGoals = currentUser.learningGoals.filter((goal) =>
    otherUser.learningGoals.includes(goal)
  );

  score += commonGoals.length * 15;

  // Learning Style Match
  if (
    currentUser.learningStyle &&
    currentUser.learningStyle === otherUser.learningStyle
  ) {
    score += 15;
  }

  // Language Match
  if (
    currentUser.preferredLanguage &&
    currentUser.preferredLanguage === otherUser.preferredLanguage
  ) {
    score += 10;
  }

  // Availability Match
  if (
    currentUser.availability &&
    currentUser.availability === otherUser.availability
  ) {
    score += 10;
  }

  // Timezone Match
  if (
    currentUser.timezone &&
    currentUser.timezone === otherUser.timezone
  ) {
    score += 10;
  }

  return Math.min(score, 100);
};

const PAGE_SIZE = 20;

// 🚀 Get Recommended Study Partners
export const getRecommendedPartners = async (req, res) => {
  try {
    const currentUserEmail = req.user.email;

    const currentUser = await User.findOne({ email: currentUserEmail });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Parse and clamp pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const skip = (page - 1) * limit;

    // Exclude the caller's email and only project fields needed for scoring.
    // Email is intentionally omitted from the projection to prevent mass PII
    // enumeration (resolves issue #146).
    const users = await User.find(
      { email: { $ne: currentUserEmail } },
      {
        _id: 1,
        name: 1,
        skills: 1,
        interests: 1,
        learningGoals: 1,
        availability: 1,
        learningStyle: 1,
        preferredLanguage: 1,
        timezone: 1,
      }
    );

    // Score all users in memory, then paginate the sorted result so the page
    // boundary is stable across requests.
    const scored = users.map((user) => ({
      _id: user._id,
      name: user.name,
      skills: user.skills,
      interests: user.interests,
      learningGoals: user.learningGoals,
      availability: user.availability,
      learningStyle: user.learningStyle,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      compatibilityScore: calculateCompatibilityScore(currentUser, user),
    }));

    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    const totalCount = scored.length;
    const recommendations = scored.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};