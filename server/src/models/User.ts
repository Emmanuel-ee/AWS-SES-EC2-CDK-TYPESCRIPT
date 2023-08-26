class User {
    public email: string;
    public name: string;
    public donations: number[];
  
    constructor(email: string, name: string) {
      this.email = email;
      this.name = name;
      this.donations = [];
    }
  }
  
  export default User;
  