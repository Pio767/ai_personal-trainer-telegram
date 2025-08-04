const fs = require('fs').promises;
const path = require('path');

class UserMemory {
    constructor() {
        this.memoryFile = path.join(__dirname, 'user_profiles.json');
        this.profiles = {};
        this.loadProfiles();
    }

    async loadProfiles() {
        try {
            const data = await fs.readFile(this.memoryFile, 'utf8');
            this.profiles = JSON.parse(data);
        } catch (error) {
            this.profiles = {};
            await this.saveProfiles();
        }
    }

    async saveProfiles() {
        try {
            await fs.writeFile(this.memoryFile, JSON.stringify(this.profiles, null, 2));
        } catch (error) {
            console.error('Błąd zapisu profili:', error);
        }
    }

    getUserProfile(userId) {
        if (!this.profiles[userId]) {
            this.profiles[userId] = {
                name: null,
                goals: [],
                language: 'pl',
                conversation_style: 'friendly',
                stats: { weight: null, height: null, age: null },
                created_at: new Date().toISOString()
            };
        }
        return this.profiles[userId];
    }

    async updateUserProfile(userId, updates) {
        const profile = this.getUserProfile(userId);
        Object.keys(updates).forEach(key => {
            profile[key] = updates[key];
        });
        await this.saveProfiles();
        return profile;
    }

    getPersonalizedContext(userId) {
        const profile = this.getUserProfile(userId);
        let context = "PROFIL UŻYTKOWNIKA:\n";
        
        if (profile.name) context += `- Imię: ${profile.name}\n`;
        if (profile.goals.length > 0) context += `- Cele: ${profile.goals.join(', ')}\n`;
        context += `- Styl: ${profile.conversation_style}\n`;
        
        return context;
    }
}

module.exports = UserMemory;
