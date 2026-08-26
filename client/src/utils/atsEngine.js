// 🤖 Simple AI Skill Match & ATS Scoring Engine (Function 1)
export const calculateATSScore = (studentSkills = "", companySkills = "", studentCGPA = 0, minCGPA = 0) => {
  if (!companySkills) return 70; // Default base score

  const studentSkillArray = studentSkills.toLowerCase().split(',').map(s => s.trim());
  const companySkillArray = companySkills.toLowerCase().split(',').map(s => s.trim());

  let matchedCount = 0;
  companySkillArray.forEach(skill => {
    if (studentSkillArray.some(s => s.includes(skill) || skill.includes(s))) {
      matchedCount++;
    }
  });

  const skillScore = companySkillArray.length > 0 ? (matchedCount / companySkillArray.length) * 70 : 50;
  const cgpaScore = parseFloat(studentCGPA) >= parseFloat(minCGPA) ? 30 : 10;

  return Math.min(Math.round(skillScore + cgpaScore), 100);
};

// 🤖 Advanced AI Skill Match & ATS Scoring Engine (Function 2)
export const calculateAdvancedATSScore = (candidateSkills = '', requiredSkills = '', candidateCgpa = 0, cutoffCgpa = 0) => {
  if (parseFloat(candidateCgpa) < parseFloat(cutoffCgpa)) {
    return Math.max(10, Math.round((parseFloat(candidateCgpa) / Math.max(1, parseFloat(cutoffCgpa))) * 40));
  }

  const candidateTokens = candidateSkills.toLowerCase().split(/[\s,]+/);
  const requiredTokens = requiredSkills.toLowerCase().split(/[\s,]+/);

  if (requiredTokens.length === 0 || !requiredSkills) return 75;

  let matches = 0;
  requiredTokens.forEach(token => {
    if (token && candidateTokens.some(c => c.includes(token))) {
      matches += 1;
    }
  });

  const skillScore = (matches / Math.max(1, requiredTokens.length)) * 60;
  const cgpaScore = Math.min(40, (parseFloat(candidateCgpa) / 10) * 40);

  return Math.min(99, Math.round(skillScore + cgpaScore));
};