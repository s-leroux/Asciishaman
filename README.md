Asciishaman
===========

[![Build Status](https://travis-ci.org/s-leroux/Asciishaman.png?branch=main)](https://travis-ci.org/s-leroux/Asciishaman)

A pure JavaScript implementation of the AsciiDoc document language for Node.

Run the tests
=============

    npm test

Sample usage
===========

    export URL_DOC="https://raw.githubusercontent.com/asciidoctor/asciidoctor-community-docs"
    wget "${URL_DOC}/main/README.adoc" -O sample.adoc
    bin/asciishaman sample.adoc > sample.html
    firefox sample.html

License
=======

Starting with Asciishaman 0.0.1, this software is provided under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
Previous versions were released under the terms of the GPLv3.0 or later license.

Copyright (c) 2021 Sylvain Leroux
