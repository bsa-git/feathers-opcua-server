
generate a new private key and Certificate Signing Request
----------------------------------------------------------
    
     $ openssl req  -out CSR.csr -new -newkey rsa:1024 -nodes -keyout privateKey.key

generate a self-signed key
--------------------------

    $ openssl req -x509 -days 365 -nodes -newkey rsa:1024 -keyout private_key.pem -out certificate.pem


verify PEM certificate
----------------------

    $ openssl x509 -in certificate.pem  -text -noout

verify DER certificate (display information about a DER certificate)
--------------------------------------------------------------------

    $ openssl x509 -in my_certificate.der -inform DER -text

generate public key from private.key
------------------------------------

    $ openssl rsa -in private_key.pem -pubout > public_key.pub

converting der to pem files
----------------------------

    $ openssl x509 -inform DER -outform PEM -text -in der-certificate-file -out pem-certificate-file
    $ openssl rsa  -inform DER -outform PEM -text -in der-rsa-key-file     -out pem-rsa-key-file

converting pem to der files:
----------------------------

    $ openssl x509 -inform PEM -outform DER  -in pem-certificate-file -out der-certificate-file
    $ openssl rsa -inform PEM -outform DER   -in  pem-rsa-key-file    -out der-rsa-key-file

converting .pfx certificates to .pem
------------------------------------
    $ openssl pkcs12 -in  cert.pfx -out cert.pem

create a root certificate
-------------------------
    $ openssl req -new -x509 -extensions v3_ca -keyout private/cakey.key -out cacert.crt -days 365 -config ./openssl.cnf

extract the public key from certificate
----------------------------------------
    $  openssl x509 -inform pem -in certificate.pem -pubkey -noout > publickey.pem

convert a pem public key to pub ssh-rsa (- ?)
---------------------------------------------

     http://stackoverflow.com/questions/1011572/convert-pem-key-to-ssh-rsa-format
     ssh-keygen -f pub1key.pub -i


display useful information on certificate such as start date and end date
---------------------------------------------
   $ openssl x509 -subject -dates -fingerprint -noout  -in cert.pem

refs:
=====
   http://users.dcc.uchile.cl/~pcamacho/tutorial/crypto/openssl/openssl_intro.html
   https://www.sslshopper.com/article-most-common-openssl-commands.html

Create a set of  key pair
-------------------------
  $ ssh-keygen -t rsa -C "Bob" -f bob_id_rsa -q -N ""
  $ ssh-keygen -t rsa -b 2048 -C "Alice" -f alice_id_rsa -q -N ""

Create a pfx file ( incorporate a private key and a certificate)
----------------------------------------------------------------
  $ openssl pkcs12 -export -out domain.name.pfx -inkey domain.name.key -in domain.name.crt -in intermediate.crt -in rootca.crt


Verifying if a public key and a private key are paired 
------------------------------------------------------

   -  a public key and private key share the same modulus 
   
   $ openssl x509 -noout -modulus -in <filename for crt>
   $ openssl rsa -noout -modulus -in <filename for key
   
### refs
 
 * https://github.com/dominictarr/ssh-key-to-pem
 * http://pki-tutorial.readthedocs.org/en/latest/simple/index.html
 * http://spin.atomicobject.com/2014/05/12/openssl-commands/

### refs:

 * https://security.stackexchange.com/questions/42268/how-do-i-get-the-rsa-bit-length-with-the-pubkey-and-openssl
 * https://serverfault.com/questions/325467/i-have-a-keypair-how-do-i-determine-the-key-length  
 * https://opcfoundation.org/wp-content/uploads/2014/05/OPC-UA_Security_Model_for_Administrators_V1.00.pdf
 * http://web.mit.edu/crypto/openssl.cnf


Setting up X509 extension on certificate
----------------------------------------

see ```cert.cnf``` configuration file
  
    $ openssl req -x509 -days 365 -nodes -newkey rsa:1024 -keyout key.pem -out cert.pem -config cert.cnf
    $ openssl req -text -noout -in server.csr
    $ openssl req -text -noout -in cert.pem

    $ openssl req -x509 -days 100000 -nodes -newkey rsa:2048 -keyout server_key256.pem -out server_cert256.pem -config cert.cnf
  
    $ openssl req  -out server_key256.csr -new -newkey rsa:2048 -nodes -keyout server_key256.pem  -config cert.cnf

### refs:
 
  * http://apetec.com/support/GenerateSAN-CSR.htm


     $ node -e "console.log(require('crypto').getHashes().join(' '))"
