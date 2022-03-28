import {
    Field,
    PrivateKey,
    PublicKey,
    SmartContract,
    state,
    State,
    method,
    UInt64,
    Mina,
    Party,
    Group,
    shutdown,
    isReady,
  } from 'snarkyjs';
  
  class CONSTANTINP2022 extends SmartContract {
    @state(Field) value: State<Field>;
    @state(Field) value2: State<Field>;
    @state(Field) value3: State<Field>;
  
    constructor(initialBalance: UInt64, address: PublicKey, x: Field[]) {
      super(address);
      this.balance.addInPlace(initialBalance);
      this.value = State.init(x[0]);
      this.value2 = State.init(x[1]);
      this.value3 = State.init(x[2]);
    }
  
    @method async update(squared: Field[]) {
      //First field
      const x = await this.value.get();
      x.square().assertEquals(squared[0]);
      this.value.set(squared[0]);


      //Second field
      const x2 = await this.value2.get();
      x2.square().assertEquals(squared[1]);
      this.value.set(squared[1]);

      //Third field
      const x3 = await this.value3.get();
      x3.square().assertEquals(squared[2]);
      this.value.set(squared[2]);
    }
  }

  async function runSimpleApp() {
    await isReady;
  
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const account1 = Local.testAccounts[0].privateKey;
    const account2 = Local.testAccounts[1].privateKey;
  
    const snappPrivkey = PrivateKey.random();
    const snappPubkey = snappPrivkey.toPublicKey();
  
    let snappInstance: CONSTANTINP2022;
    const field1 = Field(4);
    const field2 = Field(2);
    const field3 = Field(3);

    const initSnappState: Field[]  = [field1, field2, field3];
  
    // Deploys the snapp
    await Mina.transaction(account1, async () => {
      // account2 sends 1000000000 to the new snapp account
      const amount = UInt64.fromNumber(1000000000);
      const p = await Party.createSigned(account2);
      p.balance.subInPlace(amount);
  
      snappInstance = new CONSTANTINP2022(amount, snappPubkey, initSnappState);
    })
      .send()
      .wait();
  
    // Update the snapp 
    await Mina.transaction(account1, async () => {
      // 4 = 2^2

        const field1_ = Field(16);
        const field2_ = Field(4);
        const field3_ = Field(9);

        const arrayField: Field[]  = [field1_, field2_, field3_];
      await snappInstance.update(arrayField);
    })
      .send()
      .wait()
      .catch((e) => console.log('update failed'));
 
    const a = await Mina.getAccount(snappPubkey);
  
    console.log('final state value', a.snapp.appState[0].toString());
  }
  
  runSimpleApp();
  
  shutdown();
  