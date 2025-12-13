import React from 'react';

/**
 * CV Template Components
 * Each template renders CV content with unique styling
 * Templates are optimized for print and PDF export
 */

// Professional Template - Clean, modern layout with gradient accents
export const ProfessionalTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, awards, references } = cvData;
  
  return (
    <div className="cv-professional max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header with gradient background */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 rounded-t-lg">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">{contact_information?.full_name}</h1>
        <p className="text-2xl font-light mb-4 text-blue-100">{contact_information?.professional_title}</p>
        <div className="flex flex-wrap gap-3 text-sm text-blue-50">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            {contact_information?.email}
          </span>
          <span className="text-blue-200">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            {contact_information?.phone}
          </span>
          <span className="text-blue-200">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            {contact_information?.location}
          </span>
          {contact_information?.linkedin && (
            <>
              <span className="text-blue-200">•</span>
              <span className="flex items-center gap-1 text-blue-100 underline">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/></svg>
                LinkedIn
              </span>
            </>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Professional Summary */}
        {professional_summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Professional Summary
            </h2>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-transparent rounded-full"></div>
              <p className="text-gray-700 leading-relaxed pl-6 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-r-lg border-l-4 border-blue-600">
                {professional_summary}
              </p>
            </div>
          </section>
        )}

        {/* Core Competencies */}
        {core_competencies && core_competencies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Core Competencies
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {core_competencies.map((comp, idx) => (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative block bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 px-4 py-2.5 rounded-lg text-sm font-semibold border-2 border-blue-200 group-hover:border-transparent group-hover:text-white transition-all shadow-sm hover:shadow-md">
                    {comp}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {professional_experience && professional_experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Professional Experience
            </h2>
            <div className="space-y-6">
              {professional_experience.map((exp, idx) => (
                <div key={idx} className="relative pl-8 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-white shadow"></div>
                  <div className="bg-gradient-to-r from-gray-50 to-transparent p-5 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{exp.job_title}</h3>
                      <span className="text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 rounded-full font-medium whitespace-nowrap ml-4">
                        {exp.duration}
                      </span>
                    </div>
                    <p className="text-blue-700 font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>
                      {exp.company} <span className="text-gray-500">•</span> {exp.location}
                    </p>
                    {exp.description && <p className="text-gray-700 mb-3 italic">{exp.description}</p>}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, aIdx) => (
                          <li key={aIdx} className="text-gray-700 flex items-start group">
                            <span className="text-blue-600 font-bold mr-3 mt-1 group-hover:scale-125 transition-transform">●</span>
                            <span className="flex-1">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{edu.degree}</h3>
                    <span className="text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 rounded-full font-medium whitespace-nowrap ml-4">
                      {edu.graduation_date}
                    </span>
                  </div>
                  <p className="text-blue-700 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
                    {edu.institution} <span className="text-gray-500">•</span> {edu.location}
                  </p>
                  {edu.gpa && <p className="text-gray-700 mt-2 text-sm font-medium">GPA: {edu.gpa} {edu.honors && `• ${edu.honors}`}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Skills */}
        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Technical Skills
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(technical_skills).map(([category, skills], idx) => (
                skills && skills.length > 0 && (
                  <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-bl-full"></div>
                    <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wider mb-2 relative">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-gray-700 text-sm relative">
                      {Array.isArray(skills) ? skills.join(' • ') : skills}
                    </p>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Certifications & Licenses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {certifications.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-transparent p-3 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <div className="flex-1">
                    <strong className="text-gray-900 font-bold">{cert.name}</strong>
                    <p className="text-gray-600 text-sm">{cert.issuer} • {cert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Notable Projects
            </h2>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="bg-gradient-to-r from-indigo-50 to-transparent p-5 rounded-lg border-l-4 border-indigo-600 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {proj.name} <span className="text-indigo-600">•</span> <span className="text-indigo-700 font-semibold">{proj.role}</span>
                  </h3>
                  <p className="text-gray-700 mb-2">{proj.description}</p>
                  {proj.impact && (
                    <p className="text-gray-700 mb-2 flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                      <span><strong>Impact:</strong> {proj.impact}</span>
                    </p>
                  )}
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(', ')).map((tech, tIdx) => (
                        <span key={tIdx} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Awards & Recognition
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{awards.map((award, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-yellow-50 to-transparent p-3 rounded-lg border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <div className="flex-1">
                    <strong className="text-gray-900 font-bold">{award.title}</strong>
                    <p className="text-gray-600 text-sm">{award.issuer} • {award.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              References
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {references.map((ref, idx) => (
                <div key={idx} className="bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{ref.name}</h3>
                  <p className="text-blue-700 font-semibold mb-2">{ref.position}</p>
                  {ref.company && <p className="text-gray-700 mb-2">{ref.company}</p>}
                  <div className="space-y-1 text-sm text-gray-600">
                    {ref.email && (
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                        {ref.email}
                      </p>
                    )}
                    {ref.phone && (
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                        {ref.phone}
                      </p>
                    )}
                    {ref.relationship && (
                      <p className="text-gray-500 italic mt-2">{ref.relationship}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        <footer className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-sm text-gray-500 italic">References available upon request</p>
        </footer>
      </div>
    </div>
  );
};

// Creative Template - Bold, artistic design with vibrant colors
export const CreativeTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, references } = cvData;
  
  return (
    <div className="cv-creative max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
      {/* Artistic Header with Diagonal Gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="relative p-10 text-white">
          <h1 className="text-6xl font-black mb-3 tracking-tight drop-shadow-lg">{contact_information?.full_name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-20 bg-white/80 rounded-full"></div>
            <p className="text-2xl font-light text-white/95">{contact_information?.professional_title}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/90 font-medium">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">📧 {contact_information?.email}</span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">📱 {contact_information?.phone}</span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">📍 {contact_information?.location}</span>
            {contact_information?.linkedin && (
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">🔗 LinkedIn</span>
            )}
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0,30 C300,60 900,0 1200,30 L1200,60 L0,60 Z" fill="white"></path>
        </svg>
      </header>

      <div className="p-10">
        {/* Professional Summary with Colorful Accent */}
        {professional_summary && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                ✨
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                About Me
              </h2>
            </div>
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-orange-500 rounded-full"></div>
              <p className="text-gray-700 leading-relaxed text-lg pl-8 italic">
                "{professional_summary}"
              </p>
            </div>
          </section>
        )}

        {/* Core Competencies with Vibrant Pills */}
        {core_competencies && core_competencies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                🎯
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Superpowers
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {core_competencies.map((comp, idx) => {
                const colors = [
                  'from-purple-500 to-pink-500',
                  'from-pink-500 to-orange-500',
                  'from-orange-500 to-yellow-500',
                  'from-blue-500 to-purple-500',
                  'from-green-500 to-blue-500',
                  'from-yellow-500 to-red-500'
                ];
                const colorClass = colors[idx % colors.length];
                return (
                  <span key={idx} className={`bg-gradient-to-r ${colorClass} text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}>
                    {comp}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Professional Experience with Timeline */}
        {professional_experience && professional_experience.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                💼
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Experience
              </h2>
            </div>
            <div className="space-y-6">
              {professional_experience.map((exp, idx) => {
                const gradients = [
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-purple-500',
                  'from-pink-500 to-orange-500',
                  'from-green-500 to-blue-500'
                ];
                const gradient = gradients[idx % gradients.length];
                return (
                  <div key={idx} className="relative pl-10">
                    <div className={`absolute left-0 top-0 w-6 h-6 rounded-full bg-gradient-to-br ${gradient} shadow-lg border-4 border-white`}></div>
                    <div className={`absolute left-3 top-6 bottom-0 w-0.5 bg-gradient-to-b ${gradient} opacity-30`}></div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow border-2 border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-2xl font-bold text-gray-900">{exp.job_title}</h3>
                        <span className={`text-sm text-white bg-gradient-to-r ${gradient} px-4 py-1.5 rounded-full font-bold whitespace-nowrap ml-4 shadow-md`}>
                          {exp.duration}
                        </span>
                      </div>
                      <p className="text-purple-700 font-bold mb-3 text-lg">
                        {exp.company} • {exp.location}
                      </p>
                      {exp.description && <p className="text-gray-700 mb-3 italic">{exp.description}</p>}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="space-y-2">
                          {exp.achievements.map((achievement, aIdx) => (
                            <li key={aIdx} className="text-gray-700 flex items-start">
                              <span className="text-xl mr-3 mt-0.5">▸</span>
                              <span className="flex-1">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Education with Creative Cards */}
        {education && education.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                🎓
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Education
              </h2>
            </div>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow border-2 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{edu.degree}</h3>
                    <span className="text-sm text-white bg-gradient-to-r from-green-500 to-blue-500 px-4 py-1.5 rounded-full font-bold whitespace-nowrap ml-4 shadow-md">
                      {edu.graduation_date}
                    </span>
                  </div>
                  <p className="text-green-700 font-bold text-lg">{edu.institution} • {edu.location}</p>
                  {edu.gpa && <p className="text-gray-700 mt-2 font-medium">GPA: {edu.gpa} {edu.honors && `• ${edu.honors}`}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Skills with Color Grid */}
        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                ⚡
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Skills
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(technical_skills).map(([category, skills], idx) => {
                const gradients = [
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-cyan-500',
                  'from-green-500 to-teal-500',
                  'from-orange-500 to-red-500'
                ];
                const gradient = gradients[idx % gradients.length];
                return skills && skills.length > 0 && (
                  <div key={idx} className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all`}>
                    <h4 className="font-black text-white text-sm uppercase tracking-wider mb-2">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-white/90 text-sm font-medium">
                      {Array.isArray(skills) ? skills.join(' • ') : skills}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Certifications & Projects in Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl shadow-md">
                  🏆
                </div>
                <h2 className="text-2xl font-black text-gray-900 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Certifications
                </h2>
              </div>
              <div className="space-y-3">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                    <strong className="text-gray-900 font-bold block">{cert.name}</strong>
                    <p className="text-gray-600 text-sm">{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl shadow-md">
                  🚀
                </div>
                <h2 className="text-2xl font-black text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Projects
                </h2>
              </div>
              <div className="space-y-3">
                {projects.map((proj, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                    <strong className="text-gray-900 font-bold block">{proj.name}</strong>
                    <p className="text-gray-700 text-sm mt-1">{proj.description}</p>
                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(', ')).slice(0, 4).map((tech, tIdx) => (
                          <span key={tIdx} className="text-xs bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          {references && references.length > 0 && (
            <section className="mb-10">
              <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✦ References
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {references.map((ref, idx) => (
                  <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 opacity-10 rounded-bl-full"></div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">{ref.name}</h3>
                    <p className="text-purple-700 font-bold mb-2">{ref.position}</p>
                    {ref.company && <p className="text-gray-700 font-semibold mb-3">{ref.company}</p>}
                    <div className="space-y-1 text-sm text-gray-600">
                      {ref.email && (
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                          {ref.email}
                        </p>
                      )}
                      {ref.phone && (
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                          {ref.phone}
                        </p>
                      )}
                      {ref.relationship && (
                        <p className="text-gray-500 italic mt-2">{ref.relationship}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-sm text-gray-500 italic">✦ {references && references.length > 0 ? 'Additional references available upon request' : 'References available upon request'} ✦</p>
        </footer>
      </div>
    </div>
  );
};

// Modern Template - Clean minimalist design
export const ModernTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, references } = cvData;
  
  return (
    <div className="cv-modern max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sleek Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-8 rounded-t-lg">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">{contact_information?.full_name}</h1>
        <p className="text-xl mb-4 opacity-95 font-light">{contact_information?.professional_title}</p>
        <div className="flex flex-wrap gap-3 text-sm opacity-90">
          {contact_information?.email && <span>{contact_information.email}</span>}
          {contact_information?.phone && <><span>•</span><span>{contact_information.phone}</span></>}
          {contact_information?.location && <><span>•</span><span>{contact_information.location}</span></>}
        </div>
      </header>

      <div className="p-8">
        {/* Professional Summary */}
        {professional_summary && (
          <section className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-lg border-l-4 border-teal-600 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{professional_summary}</p>
          </section>
        )}

        {/* Core Competencies */}
        {core_competencies && core_competencies.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              CORE COMPETENCIES
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            <div className="flex flex-wrap gap-2">
              {core_competencies.map((comp, idx) => (
                <span key={idx} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
                  {comp}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {professional_experience && professional_experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              PROFESSIONAL EXPERIENCE
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            {professional_experience.map((exp, idx) => (
              <div key={idx} className="mb-5 p-4 bg-white rounded-lg shadow-sm border-l-4 border-teal-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{exp.job_title}</h3>
                  <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold">{exp.duration}</span>
                </div>
                <p className="text-teal-600 font-semibold mb-2">{exp.company} • {exp.location}</p>
                {exp.description && <p className="text-gray-700 text-sm mb-2 italic">{exp.description}</p>}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {exp.achievements.map((achievement, aIdx) => (
                      <li key={aIdx} className="text-gray-700 flex items-start text-sm">
                        <span className="text-teal-600 mr-2">▸</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              EDUCATION
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            {education.map((edu, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-teal-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                  <span className="text-sm text-gray-600 font-medium">{edu.graduation_date}</span>
                </div>
                <p className="text-teal-600 font-semibold">{edu.institution} • {edu.location}</p>
                {edu.gpa && <p className="text-gray-700 text-sm mt-1">GPA: {edu.gpa} {edu.honors && `• ${edu.honors}`}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Technical Skills */}
        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              TECHNICAL SKILLS
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(technical_skills).map(([category, skills], idx) => (
                skills && skills.length > 0 && (
                  <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border-t-2 border-teal-600 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-teal-600 text-sm uppercase mb-1">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {Array.isArray(skills) ? skills.join(', ') : skills}
                    </p>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Certifications & Projects */}
        {(certifications && certifications.length > 0) && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              CERTIFICATIONS
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            <ul className="space-y-2">
              {certifications.map((cert, idx) => (
                <li key={idx} className="text-gray-700 flex items-start">
                  <span className="text-teal-600 font-bold mr-2">▸</span>
                  <span><strong>{cert.name}</strong> - {cert.issuer} ({cert.date})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {projects && projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 relative pb-2">
              PROJECTS
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full"></div>
            </h2>
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-cyan-600 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900">{proj.name} - {proj.role}</h3>
                <p className="text-gray-700 mt-1">{proj.description}</p>
                {proj.impact && <p className="text-gray-700 mt-1"><strong>Impact:</strong> {proj.impact}</p>}
                {proj.technologies && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Technologies:</strong> {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-teal-700 mb-4 border-b-2 border-teal-600 pb-2">References</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {references.map((ref, idx) => (
                <div key={idx} className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border-l-4 border-teal-600 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-bold text-gray-900 mb-1">{ref.name}</h3>
                  <p className="text-teal-700 font-semibold text-sm mb-2">{ref.position}</p>
                  {ref.company && <p className="text-gray-700 text-sm mb-2">{ref.company}</p>}
                  <div className="space-y-1 text-xs text-gray-600">
                    {ref.email && (
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                        {ref.email}
                      </p>
                    )}
                    {ref.phone && (
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                        {ref.phone}
                      </p>
                    )}
                    {ref.relationship && (
                      <p className="text-gray-500 italic mt-1">{ref.relationship}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-sm text-gray-600 italic">{references && references.length > 0 ? 'Additional references available upon request' : 'References available upon request'}</p>
        </footer>
      </div>
    </div>
  );
};

// Export all templates
const CV_TEMPLATES = {
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  modern: ModernTemplate,
};

export default CV_TEMPLATES;
